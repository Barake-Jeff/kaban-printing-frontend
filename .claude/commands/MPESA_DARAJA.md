# M-Pesa Daraja Integration Guide

> This file covers everything the agent needs to implement M-Pesa STK Push correctly.
> Daraja has specific quirks that the agent will get wrong without this context.

---

## Overview of the payment flow

```
Customer taps "Pay via M-Pesa"
        ↓
Frontend calls POST /api/payments/mpesa/stk
        ↓
Backend generates access token from Daraja OAuth
        ↓
Backend sends STK Push request to Daraja
        ↓
Daraja sends a prompt to the customer's phone
        ↓
Customer enters their M-Pesa PIN
        ↓
Daraja sends a callback to POST /api/payments/mpesa/callback
        ↓
Backend verifies callback, updates payment + job status
        ↓
Backend triggers notification (SMS/WhatsApp) to customer
        ↓
Frontend polls GET /api/jobs/:id or receives WebSocket event
```

---

## Environment variables needed

```env
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379                          # sandbox shortcode
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919  # sandbox passkey
MPESA_CALLBACK_URL=https://your-url.ngrok.io/api/payments/mpesa/callback
MPESA_ENVIRONMENT=sandbox                        # sandbox | production
```

**Sandbox base URLs:**
- Auth: `https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`
- STK Push: `https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest`
- STK Query: `https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query`

**Production base URLs** (same paths, different host):
- `https://api.safaricom.co.ke/...`

Use ConfigService to switch between environments:
```typescript
const baseUrl = this.config.get('MPESA_ENVIRONMENT') === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';
```

---

## Step 1 — Get access token

The access token expires in 1 hour. Cache it; do not request a new one for every payment.

```typescript
async getAccessToken(): Promise<string> {
  const key    = this.config.get('MPESA_CONSUMER_KEY');
  const secret = this.config.get('MPESA_CONSUMER_SECRET');
  const credentials = Buffer.from(`${key}:${secret}`).toString('base64');

  const baseUrl = this.getMpesaBaseUrl();
  const response = await axios.get(
    `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` } },
  );

  return response.data.access_token;
}
```

---

## Step 2 — Generate the password

The password is a base64 string of: `Shortcode + Passkey + Timestamp`
The timestamp format is: `YYYYMMDDHHmmss` (14 digits, no separators)

```typescript
generatePassword(): { password: string; timestamp: string } {
  const shortcode = this.config.get('MPESA_SHORTCODE');
  const passkey   = this.config.get('MPESA_PASSKEY');
  const timestamp = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, '')
    .slice(0, 14);                           // → '20260527114500'

  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`)
    .toString('base64');

  return { password, timestamp };
}
```

This is the most common mistake agents make — wrong timestamp format or wrong concatenation order.

---

## Step 3 — Send STK Push

```typescript
async initiateStk(jobId: string, phone: string, amount: number) {
  const token             = await this.getAccessToken();
  const { password, timestamp } = this.generatePassword();
  const shortcode         = this.config.get('MPESA_SHORTCODE');
  const callbackUrl       = this.config.get('MPESA_CALLBACK_URL');
  const baseUrl           = this.getMpesaBaseUrl();

  // Phone must be in format 2547XXXXXXXX (no + sign, no leading 0)
  const formattedPhone = phone.replace(/^0/, '254').replace(/^\+/, '');

  const payload = {
    BusinessShortCode: shortcode,
    Password:          password,
    Timestamp:         timestamp,
    TransactionType:   'CustomerPayBillOnline',
    Amount:            Math.ceil(amount),          // must be integer, round UP
    PartyA:            formattedPhone,
    PartyB:            shortcode,
    PhoneNumber:       formattedPhone,
    CallBackURL:       callbackUrl,
    AccountReference:  `PrintEase-${jobId}`,       // max 12 chars
    TransactionDesc:   'Print job payment',         // max 13 chars
  };

  const response = await axios.post(
    `${baseUrl}/mpesa/stkpush/v1/processrequest`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  // Save CheckoutRequestID to payments table — needed to match the callback
  return response.data;
  // response.data.CheckoutRequestID is the key field to save
}
```

**Important field limits:**
- `AccountReference`: max 12 characters
- `TransactionDesc`: max 13 characters
- `Amount`: must be a whole number integer — use `Math.ceil()`
- `PhoneNumber`: must start with `254`, no `+`, no leading `0`

---

## Step 4 — Handle the Daraja callback

This endpoint receives the payment result from Safaricom. It MUST be public (no JWT guard).
Safaricom sends a POST request to your `CallBackURL`.

```typescript
// payments.controller.ts
@Post('mpesa/callback')
// NO @UseGuards() here — this must be publicly accessible
async mpesaCallback(@Body() body: any) {
  await this.paymentsService.handleCallback(body);
  // Daraja expects this exact response, otherwise it will retry
  return { ResultCode: 0, ResultDesc: 'Accepted' };
}
```

**Callback payload shape from Daraja:**

```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "29115-34620561-1",
      "CheckoutRequestID": "ws_CO_191220191020363925",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          { "Name": "Amount",              "Value": 80 },
          { "Name": "MpesaReceiptNumber",  "Value": "QHX3K8P2" },
          { "Name": "TransactionDate",     "Value": 20260527114500 },
          { "Name": "PhoneNumber",         "Value": 254712345678 }
        ]
      }
    }
  }
}
```

**ResultCode meanings:**
- `0` = success (payment completed)
- `1032` = customer cancelled
- `1037` = timeout (customer didn't respond)
- `2001` = wrong PIN
- Any non-zero = failure

**Callback handler logic:**

```typescript
async handleCallback(body: any): Promise<void> {
  const callback = body?.Body?.stkCallback;
  if (!callback) return;

  const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;

  // Find the payment by CheckoutRequestID
  const payment = await this.paymentRepo.findOne({
    where: { checkoutReqId: CheckoutRequestID },
    relations: ['job'],
  });
  if (!payment) return;

  if (ResultCode === 0) {
    // Extract values from CallbackMetadata.Item array
    const items = CallbackMetadata?.Item ?? [];
    const getValue = (name: string) =>
      items.find(i => i.Name === name)?.Value;

    payment.mpesaRef    = getValue('MpesaReceiptNumber');
    payment.mpesaReceipt = getValue('MpesaReceiptNumber');
    payment.status      = 'completed';
    payment.paidAt      = new Date();
    await this.paymentRepo.save(payment);

    // Update the job
    await this.jobRepo.update(payment.jobId, {
      paymentStatus: 'paid',
      mpesaRef: payment.mpesaRef,
      status: 'pending',   // now enters the print queue
    });

    // Trigger notification
    await this.notificationsService.send(payment.jobId, 'payment_confirmed');
  } else {
    payment.status     = 'failed';
    payment.resultCode = String(ResultCode);
    payment.resultDesc = ResultDesc;
    await this.paymentRepo.save(payment);
  }
}
```

The `CallbackMetadata.Item` is an array, not an object. Use `.find()` to extract values by `Name`. This is a very common mistake.

---

## Step 5 — STK Push query (optional polling fallback)

If you want to check payment status without waiting for the callback (useful in dev with ngrok):

```typescript
async queryStk(checkoutRequestId: string) {
  const token = await this.getAccessToken();
  const { password, timestamp } = this.generatePassword();
  const baseUrl = this.getMpesaBaseUrl();

  const response = await axios.post(
    `${baseUrl}/mpesa/stkpushquery/v1/query`,
    {
      BusinessShortCode: this.config.get('MPESA_SHORTCODE'),
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    },
    { headers: { Authorization: `Bearer ${token}` } },
  );

  return response.data;
}
```

---

## Pay on pickup flow (no Daraja involved)

```typescript
async confirmPickupPayment(jobId: string, adminUserId: string): Promise<void> {
  const job = await this.jobRepo.findOne({ where: { id: jobId } });
  if (!job) throw new NotFoundException('Job not found');
  if (job.paymentStatus !== 'pay_on_pickup') {
    throw new BadRequestException('Job is not a pay-on-pickup job');
  }

  await this.jobRepo.update(jobId, { paymentStatus: 'paid' });

  // Log the cash payment
  await this.paymentRepo.save({
    jobId,
    userId: job.userId,
    method: 'cash',
    amount: job.cost + job.deliveryFee,
    status: 'completed',
    paidAt: new Date(),
  });

  await this.notificationsService.send(jobId, 'payment_confirmed');
}
```

---

## Development setup — exposing callback URL

Daraja cannot call `localhost`. Use one of these during development:

**Option 1 — ngrok (recommended):**
```bash
ngrok http 3000
# Copy the https URL → set as MPESA_CALLBACK_URL in .env
# e.g. https://abc123.ngrok.io/api/payments/mpesa/callback
```

**Option 2 — Cloudflare Tunnel:**
```bash
cloudflared tunnel --url http://localhost:3000
```

Restart the NestJS server after updating `.env`.

---

## Testing M-Pesa in sandbox

Sandbox test credentials:
- Shortcode: `174379`
- Test phone number: `254708374149` (Safaricom's sandbox test number)
- PIN: any 4-digit PIN works in sandbox

The sandbox STK Push will NOT actually prompt a real phone. You must manually call the STK Query endpoint or simulate the callback using Postman/curl to test the callback handler.

**Simulate callback with curl:**
```bash
curl -X POST http://localhost:3000/api/payments/mpesa/callback \
  -H "Content-Type: application/json" \
  -d '{
    "Body": {
      "stkCallback": {
        "MerchantRequestID": "test-123",
        "CheckoutRequestID": "YOUR_CHECKOUT_REQ_ID_HERE",
        "ResultCode": 0,
        "ResultDesc": "The service request is processed successfully.",
        "CallbackMetadata": {
          "Item": [
            { "Name": "Amount", "Value": 80 },
            { "Name": "MpesaReceiptNumber", "Value": "QHX3K8P2" },
            { "Name": "TransactionDate", "Value": 20260527114500 },
            { "Name": "PhoneNumber", "Value": 254712345678 }
          ]
        }
      }
    }
  }'
```

---

## Common mistakes to avoid

1. **Wrong phone format** — always strip `+` and replace leading `0` with `254`
2. **Float amount** — Daraja rejects decimals, always use `Math.ceil(amount)`
3. **Wrong timestamp format** — must be `YYYYMMDDHHmmss`, 14 digits, no separators
4. **AccountReference too long** — max 12 characters, `PrintEase-1042` = 14 chars ❌, use `PE-1042` ✓
5. **Callback not public** — never put `JwtAuthGuard` on the callback endpoint
6. **CallbackMetadata.Item is an array** — use `.find()`, not direct key access
7. **Not saving CheckoutRequestID** — you cannot match the callback without it
8. **Caching access token** — request a new token per session or cache with TTL < 1 hour
