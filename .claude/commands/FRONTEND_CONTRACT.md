# Frontend Contract — API Response Shapes

> This file defines exactly what each API endpoint must return.
> Field names, types, and nesting must match this spec exactly.
> The Vue frontend stores are already written against these shapes.

---

## Why this file exists

The Nuxt 3 frontend (`data/dummy.ts`) was built first.
All stores use these exact field names. If the backend returns `color_mode`
instead of `colorMode`, the frontend breaks silently.
Never change a field name in an API response without updating the frontend store.

---

## Auth responses

### POST /api/auth/login → POST /api/auth/signup

```typescript
// data shape inside the response envelope
{
  accessToken:  string,    // JWT, expires in 15 minutes
  refreshToken: string,    // JWT, expires in 7 days
  user: {
    id:          string,
    name:        string,
    phone:       string,
    houseNumber: string,   // ← camelCase, not house_number
    estate:      string,
    role:        'customer' | 'clerk' | 'admin',
  }
}
```

### POST /api/auth/refresh

```typescript
{
  accessToken: string,
}
```

---

## Job shapes

### GET /api/jobs/my  (customer — their own jobs)

```typescript
// Returns array of:
{
  id:            string,           // e.g. 'JOB-1042' or UUID
  userId:        string,
  fileName:      string | null,    // null if instruction-based job
  fileType:      string | null,    // 'pdf', 'docx', 'jpg', etc.
  instructions:  string | null,    // null if file-based job
  pages:         number,
  copies:        number,
  colorMode:     'bw' | 'color',
  sides:         'single' | 'double',
  paperSize:     string,           // 'A4', 'A5', 'A3', 'Letter'
  deliveryType:  'pickup' | 'delivery',
  paymentMethod: 'mpesa' | 'pay_on_pickup',
  paymentStatus: 'unpaid' | 'paid' | 'pay_on_pickup',
  mpesaRef:      string | null,
  status:        'pending' | 'printing' | 'ready' | 'delivered',
  cost:          number,           // print cost in KES
  deliveryFee:   number,           // 0 or 50
  adminNotes:    string,           // empty string if none
  notifySms:     boolean,
  notifyWhatsapp: boolean,
  createdAt:     string,           // ISO 8601: '2026-05-27T09:14:00Z'
  updatedAt:     string,
}
```

### GET /api/admin/jobs  (admin — all jobs with customer info)

Same as above, plus:

```typescript
{
  // ...all job fields above...
  customerName: string,      // joined from users table
  houseNumber:  string,      // joined from users table
  phone:        string,      // joined from users table
}
```

---

## Admin stats

### GET /api/admin/stats

```typescript
{
  jobsToday:    number,    // count of jobs created today
  pending:      number,    // count with status = 'pending'
  completed:    number,    // count with status = 'delivered'
  revenueToday: number,    // sum of (cost + delivery_fee) for paid jobs today
}
```

---

## Customer list

### GET /api/admin/customers

```typescript
// Returns array of:
{
  id:               string,
  name:             string,
  houseNumber:      string,
  phone:            string,
  totalJobs:        number,
  totalSpent:       number,    // KES, sum of all paid jobs
  payOnPickupCount: number,    // count of pay_on_pickup jobs
  mpesaCount:       number,    // count of mpesa jobs
}
```

### GET /api/admin/customers/lookup?house=14B

Returns single object from the array above, or 404 if not found.

---

## File upload response

### POST /api/files/upload

```typescript
{
  fileId:    string,     // UUID saved in files table
  fileName:  string,     // original filename
  fileUrl:   string,     // MinIO presigned URL for original (expires 1h)
  pdfUrl:    string,     // MinIO presigned URL for converted PDF (expires 1h)
  pageCount: number,     // actual page count from PDF parser
}
```

---

## Payment initiation

### POST /api/payments/mpesa/stk

Request body:
```typescript
{
  jobId: string,
  phone: string,   // customer phone, e.g. '0712345678'
}
```

Response:
```typescript
{
  checkoutRequestId: string,   // save this for status polling
  merchantRequestId: string,
  responseCode:      string,   // '0' = request accepted
  responseDesc:      string,
  customerMessage:   string,
}
```

---

## Notification log (for admin reports — future)

```typescript
{
  id:         string,
  jobId:      string,
  channel:    'sms' | 'whatsapp',
  trigger:    string,      // 'job_received' | 'payment_confirmed' | 'job_ready' | 'delivered'
  phone:      string,
  status:     'sent' | 'failed',
  sentAt:     string,      // ISO 8601
}
```

---

## Nuxt store → API endpoint mapping

Stores live in `stores/auth.ts`, `stores/jobs.ts`, `stores/admin.ts`.
They are auto-imported by Nuxt — no import statement needed in pages/components.

| Store method                         | HTTP call                                    |
|--------------------------------------|----------------------------------------------|
| `useAuthStore().login()`             | POST /api/auth/login                         |
| `useAuthStore().signup()`            | POST /api/auth/signup                        |
| `useAuthStore().logout()`            | POST /api/auth/logout                        |
| `useJobsStore().fetchMyJobs()`       | GET /api/jobs/my                             |
| `useJobsStore().submitJob()`         | POST /api/jobs                               |
| `useJobsStore().initiateMpesa(jobId)`| POST /api/payments/mpesa/stk                 |
| `useAdminStore().fetchQueue()`       | GET /api/admin/jobs                          |
| `useAdminStore().updateJobStatus()`  | PATCH /api/admin/jobs/:id/status             |
| `useAdminStore().markAsPaid(id)`     | PATCH /api/payments/:jobId/pickup            |
| `useAdminStore().saveNotes()`        | PATCH /api/admin/jobs/:id/notes              |
| `useAdminStore().cancelJob(id)`      | DELETE /api/admin/jobs/:id                   |
| `useAdminStore().lookupCustomer()`   | GET /api/admin/customers/lookup?house={house}|

---

## How to connect the frontend to the backend

When the backend is ready, replace the dummy store methods with `$fetch` calls.

**Step 1 — Add API base URL to `nuxt.config.ts`:**

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:3000/api',
    },
  },
})
```

**Step 2 — Create `composables/useApi.ts`:**

```typescript
export function useApi() {
  const config = useRuntimeConfig()

  return $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ options }) {
      const token = localStorage.getItem('accessToken')
      if (token) {
        options.headers = { ...options.headers, Authorization: `Bearer ${token}` }
      }
    },
    async onResponseError({ response }) {
      if (response.status === 401) {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const data = await $fetch<{ data: { accessToken: string } }>(
            '/auth/refresh',
            { baseURL: config.public.apiBase, method: 'POST', body: { refreshToken } }
          )
          localStorage.setItem('accessToken', data.data.accessToken)
        }
      }
    },
  })
}
```

**Step 3 — Replace dummy store methods one at a time:**

```typescript
// Before (dummy):
async function fetchMyJobs() {
  loading.value = true
  await delay(600)
  jobs.value = [...JOBS]
  loading.value = false
}

// After (real API):
async function fetchMyJobs() {
  loading.value = true
  const api = useApi()
  try {
    const res = await api<{ data: Job[] }>('/jobs/my')
    jobs.value = res.data   // unwrap the envelope
  } finally {
    loading.value = false
  }
}
```

---

## Field name cross-reference (frontend dummy.js → backend response)

Every field in this table must match exactly between dummy.js and the backend.

| dummy.js field      | Backend response field  | MySQL column        |
|---------------------|-------------------------|---------------------|
| `id`                | `id`                    | `id`                |
| `userId`            | `userId`                | `user_id`           |
| `fileName`          | `fileName`              | `file_name`         |
| `fileType`          | `fileType`              | (derived from mime_type) |
| `instructions`      | `instructions`          | `instructions`      |
| `pages`             | `pages`                 | `pages`             |
| `copies`            | `copies`                | `copies`            |
| `colorMode`         | `colorMode`             | `color_mode`        |
| `sides`             | `sides`                 | `sides`             |
| `paperSize`         | `paperSize`             | `paper_size`        |
| `deliveryType`      | `deliveryType`          | `delivery_type`     |
| `paymentMethod`     | `paymentMethod`         | `payment_method`    |
| `paymentStatus`     | `paymentStatus`         | `payment_status`    |
| `mpesaRef`          | `mpesaRef`              | `mpesa_ref`         |
| `status`            | `status`                | `status`            |
| `cost`              | `cost`                  | `cost`              |
| `deliveryFee`       | `deliveryFee`           | `delivery_fee`      |
| `adminNotes`        | `adminNotes`            | `admin_notes`       |
| `notifySms`         | `notifySms`             | `notif_sms`         |
| `notifyWhatsapp`    | `notifyWhatsapp`        | `notif_whatsapp`    |
| `createdAt`         | `createdAt`             | `created_at`        |
| `updatedAt`         | `updatedAt`             | `updated_at`        |
| `customerName`      | `customerName`          | (joined: users.name)|
| `houseNumber`       | `houseNumber`           | `house_number`      |
| `phone`             | `phone`                 | `phone`             |
