# Notifications — SMS & WhatsApp

> This file covers when, how, and what to send for every job status change.
> The notifications module is called by other modules — it never calls them.

---

## Notification triggers

Every status change fires a notification. The message content and channels depend on the trigger.

| Trigger               | Channels            | When it fires                                     |
|-----------------------|---------------------|---------------------------------------------------|
| `job_received`        | SMS + push          | Job submitted successfully                        |
| `payment_confirmed`   | SMS + push          | M-Pesa callback received with ResultCode 0        |
| `printing_started`    | Push only           | Clerk marks status → 'printing'                   |
| `job_ready`           | SMS + WhatsApp + push | Clerk marks status → 'ready'                    |
| `job_delivered`       | SMS                 | Clerk marks status → 'delivered'                  |
| `payment_failed`      | SMS                 | M-Pesa callback with non-zero ResultCode          |

---

## Message templates

### job_received

```
Hi {name}! Your print job has been received.

Job #{jobId} · House {houseNumber}
File: {fileName}
{pages} pages · {copies} copies · Pickup

Total: KES {total}

Pay via M-Pesa to confirm your order.
```

### payment_confirmed

```
✓ Payment received — KES {amount}

Job #{jobId} is now in the print queue. We'll notify you when it's ready.

Est. wait: 20–30 min.
```

### printing_started

```
🖨 Your job is printing now.

Job #{jobId} · House {houseNumber}
Should be ready in ~10 minutes.
```

### job_ready (pickup)

```
Your print is ready! 🎉

Job #{jobId} · House {houseNumber}

Come collect at your convenience. We're open until 8 PM.

Thank you for using PrintEase.
```

### job_ready (delivery)

```
Your print is on the way! 🚚

Job #{jobId} · House {houseNumber}

Your documents are being delivered to your house.

Thank you for using PrintEase.
```

### job_delivered

```
Job #{jobId} collected. Thank you!

Need to print again? Visit printease.co.ke

PrintEase — your neighbourhood print shop 🏠
```

### payment_failed

```
Payment for Job #{jobId} was not completed.

Please try again from the PrintEase app or contact support.

PrintEase Support: 0712 345 678
```

---

## SMS — Africa's Talking

Install the SDK:
```bash
npm install africastalking
```

```typescript
// notifications.service.ts
import * as AfricasTalking from 'africastalking';

@Injectable()
export class NotificationsService {
  private at: any;
  private sms: any;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(NotificationLog)
    private readonly logRepo: Repository<NotificationLog>,
  ) {
    this.at = AfricasTalking({
      apiKey:   this.config.get('AT_API_KEY'),
      username: this.config.get('AT_USERNAME'),   // 'sandbox' for testing
    });
    this.sms = this.at.SMS;
  }

  async sendSms(phone: string, message: string, jobId: string, userId: string, trigger: string) {
    // Phone must be in international format: +254712345678
    const formattedPhone = phone.startsWith('+')
      ? phone
      : `+254${phone.replace(/^0/, '')}`;

    try {
      const result = await this.sms.send({
        to:      [formattedPhone],
        message,
        from:    'PrintEase',    // sender ID (requires AT approval in production)
      });

      await this.logRepo.save({
        jobId,
        userId,
        channel:    'sms',
        trigger,
        phone:      formattedPhone,
        message,
        status:     'sent',
        providerId: result.SMSMessageData?.Recipients?.[0]?.messageId,
      });
    } catch (err) {
      await this.logRepo.save({
        jobId, userId, channel: 'sms', trigger, phone: formattedPhone,
        message, status: 'failed',
      });
      // Never throw from notification failure — it should not block the main flow
      console.error('SMS send failed:', err.message);
    }
  }
}
```

---

## WhatsApp

Use WhatsApp Business API (official) or a gateway like WhatApp/Pindo.
The implementation is identical to SMS but with a different HTTP call.

```typescript
async sendWhatsapp(phone: string, message: string, jobId: string, userId: string, trigger: string) {
  const formattedPhone = `254${phone.replace(/^0/, '').replace(/^\+254/, '')}`;

  try {
    await axios.post(
      this.config.get('WHATSAPP_API_URL'),
      {
        messaging_product: 'whatsapp',
        to:      formattedPhone,
        type:    'text',
        text:    { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${this.config.get('WHATSAPP_TOKEN')}`,
          'Content-Type': 'application/json',
        },
      },
    );

    await this.logRepo.save({
      jobId, userId, channel: 'whatsapp', trigger, phone: formattedPhone, message, status: 'sent',
    });
  } catch (err) {
    await this.logRepo.save({
      jobId, userId, channel: 'whatsapp', trigger, phone: formattedPhone, message, status: 'failed',
    });
    console.error('WhatsApp send failed:', err.message);
  }
}
```

---

## Main send method — called by other modules

```typescript
async send(jobId: string, trigger: string): Promise<void> {
  // Load job with user
  const job = await this.jobRepo.findOne({
    where: { id: jobId },
    relations: ['user'],
  });
  if (!job) return;

  const { user } = job;
  const total    = job.cost + job.deliveryFee;

  const message  = this.buildMessage(trigger, {
    name:         user.name.split(' ')[0],
    jobId:        job.id,
    houseNumber:  user.houseNumber,
    fileName:     job.fileName ?? 'Your job',
    pages:        job.pages,
    copies:       job.copies,
    total,
    amount:       total,
    deliveryType: job.deliveryType,
  });

  // SMS: send on all triggers except printing_started
  if (trigger !== 'printing_started' && user.notifSms) {
    await this.sendSms(user.phone, message, jobId, user.id, trigger);
  }

  // WhatsApp: only on job_ready
  if (trigger === 'job_ready' && user.notifWhatsapp) {
    await this.sendWhatsapp(user.phone, message, jobId, user.id, trigger);
  }
}

private buildMessage(trigger: string, data: Record<string, any>): string {
  const templates: Record<string, string> = {
    job_received:      `Hi ${data.name}! Your print job has been received.\n\nJob #${data.jobId} · House ${data.houseNumber}\nFile: ${data.fileName}\n${data.pages} pages · ${data.copies} copies\n\nTotal: KES ${data.total}\n\nPay via M-Pesa to confirm your order.`,
    payment_confirmed: `✓ Payment received — KES ${data.amount}\n\nJob #${data.jobId} is now in the print queue. We'll notify you when it's ready.\n\nEst. wait: 20–30 min.`,
    printing_started:  `🖨 Your job is printing now.\n\nJob #${data.jobId} · House ${data.houseNumber}\nShould be ready in ~10 minutes.`,
    job_ready:         data.deliveryType === 'delivery'
      ? `Your print is on the way! 🚚\n\nJob #${data.jobId} · House ${data.houseNumber}\n\nYour documents are being delivered to your house.\n\nThank you for using PrintEase.`
      : `Your print is ready! 🎉\n\nJob #${data.jobId} · House ${data.houseNumber}\n\nCome collect at your convenience. We're open until 8 PM.\n\nThank you for using PrintEase.`,
    job_delivered:     `Job #${data.jobId} collected. Thank you!\n\nNeed to print again? Visit printease.co.ke\n\nPrintEase — your neighbourhood print shop 🏠`,
    payment_failed:    `Payment for Job #${data.jobId} was not completed.\n\nPlease try again from the PrintEase app or contact support.\n\nPrintEase Support: 0712 345 678`,
  };

  return templates[trigger] ?? `Update on Job #${data.jobId}: ${trigger}`;
}
```

---

## Who calls notifications.send()

| Caller module | Where it calls            | Trigger                |
|---------------|---------------------------|------------------------|
| `jobs`        | after job created         | `job_received`         |
| `payments`    | after callback success    | `payment_confirmed`    |
| `payments`    | after callback failure    | `payment_failed`       |
| `admin`       | after status → printing   | `printing_started`     |
| `admin`       | after status → ready      | `job_ready`            |
| `admin`       | after status → delivered  | `job_delivered`        |

NotificationsModule must be exported and imported in each calling module.

---

## Africa's Talking sandbox testing

- Username: `sandbox`
- API key: get from sandbox dashboard at account.africastalking.com
- In sandbox, SMS goes to the AT Simulator, not a real phone
- Run the AT Simulator from the sandbox dashboard to see messages

---

## Rules

- Never throw an exception from a notification failure — log it and continue
- Never block the main response waiting for SMS delivery confirmation
- Use `try/catch` in every send method
- Always log to `notifications_log` whether success or failure
- Phone formatting: Africa's Talking needs `+254...`, WhatsApp needs `254...` (no plus)
