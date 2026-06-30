# PrintEase — Master Project Context

> Read this file at the start of every session before writing any code.
> This is the single source of truth for project decisions, naming, and structure.

---

## What this project is

PrintEase is a neighbourhood print shop management platform for a home-based printing business in Nairobi, Kenya. Customers submit print jobs via a web app, pay via M-Pesa or on pickup, and track their job status in real time. Clerks manage the queue from an admin dashboard. A separate Electron desktop app on the print PC receives confirmed jobs and handles printing.

---

## Current build phase

```
Phase:         Backend — NestJS API (Beta)
Goal:          Build and wire up the full backend so the Nuxt frontend
               runs against a real API instead of dummy data.
               Daraja (M-Pesa) and Africa's Talking (SMS) are NOT integrated
               yet — stub those out with placeholder responses.

Build order:
  1. Project scaffold (NestJS, Sequelize, MySQL, config, CORS)
  2. auth       — register, login, JWT access + refresh tokens, logout
  3. users      — profile, house number lookup
  4. jobs       — create, list (customer), list (admin queue), update status
  5. files      — upload, validate, LibreOffice PDF conversion, serve
  6. payments   — pay-on-pickup confirmation; M-Pesa → STUB (returns mock response)
  7. notifications — STUB (log to console only, no real SMS/WhatsApp)
  8. admin      — stats, customer list, queue management endpoints
  9. Frontend wiring — replace dummy store methods with real $fetch calls

Do NOT build:  Real Daraja STK Push or Africa's Talking SMS (stubs only)
```

---

## Tech stack

| Layer            | Technology                              |
|------------------|-----------------------------------------|
| Frontend         | Nuxt 3 + Tailwind CSS + Pinia           |
| Backend          | NestJS + Sequelize + MySQL              |
| Auth             | JWT (access + refresh tokens)           |
| Payments         | Safaricom Daraja API (M-Pesa STK Push)  |
| File storage     | Local disk → MinIO-compatible interface |
| File conversion  | LibreOffice headless → PDF              |
| Notifications    | Africa's Talking (SMS) + WhatsApp API   |
| Print client     | Electron (separate app, same repo)      |
| API gateway      | None at this stage (direct NestJS)      |
| Environment      | Ubuntu / Windows dev, Docker for prod   |

---

## Repository structure

```
printease/
  kaban-printing-frontend/   ← Nuxt 3 app (already built)
    pages/
    components/
    stores/            ← auth.ts, jobs.ts, admin.ts
    data/dummy.ts      ← field shapes that backend responses must match
    layouts/
    .claude/commands/  ← These skill files
  backend/             ← NestJS app (being built)
    src/
      modules/
        auth/
        users/
        jobs/
        payments/
        files/
        notifications/
        admin/
      common/
        guards/
        decorators/
        interceptors/
        filters/
        dto/
      config/
      database/
        models/
        migrations/
  electron/            ← Print client (built separately)
```

---

## Module responsibilities (one-line each)

| Module          | Responsibility                                                  |
|-----------------|-----------------------------------------------------------------|
| `auth`          | Register, login, JWT issue, refresh, logout                     |
| `users`         | User profile, house number lookup, role management              |
| `jobs`          | Create job, fetch queue, update status, cancel, archive         |
| `payments`      | M-Pesa STK Push, Daraja callback, pay-on-pickup confirmation    |
| `files`         | Upload, validate, convert to PDF, extract page count, serve URL |
| `notifications` | SMS and WhatsApp triggers on every job status change            |
| `admin`         | Queue stats, reports, customer lookup — admin-role endpoints    |

---

## API base URL

```
Development:  http://localhost:3000/api
Production:   https://api.printease.co.ke/api   (update when deployed)
```

All routes are prefixed with `/api` via `app.setGlobalPrefix('api')` in `main.ts`.

---

## Complete API contract

These are the exact endpoints the Vue frontend stores call.
Field names in responses must match the frontend dummy data exactly.

### Auth

```
POST   /api/auth/signup          → register new customer
POST   /api/auth/login           → returns { accessToken, refreshToken, user }
POST   /api/auth/refresh         → body: { refreshToken } → new accessToken
POST   /api/auth/logout          → blacklists refresh token
```

### Jobs (customer-facing)

```
GET    /api/jobs/my              → array of jobs for current user
POST   /api/jobs                 → submit new print job
GET    /api/jobs/:id             → single job detail
```

### Payments

```
POST   /api/payments/mpesa/stk   → initiate STK Push, body: { jobId, phone }
POST   /api/payments/mpesa/callback  → Daraja webhook (no auth guard)
PATCH  /api/payments/:jobId/pickup   → confirm pay-on-pickup as paid
```

### Files

```
POST   /api/files/upload         → multipart upload, returns { fileUrl, pageCount, fileName }
GET    /api/files/:filename      → serve file (authenticated)
```

### Admin (admin role only)

```
GET    /api/admin/jobs           → full job queue with customer info
GET    /api/admin/stats          → { jobsToday, pending, completed, revenueToday }
GET    /api/admin/customers      → all customers
GET    /api/admin/customers/lookup?house=14B → single customer by house number
PATCH  /api/admin/jobs/:id/status  → { status: 'printing' | 'ready' | 'delivered' }
PATCH  /api/admin/jobs/:id/payment → mark pay-on-pickup as paid
PATCH  /api/admin/jobs/:id/notes   → { notes: string }
DELETE /api/admin/jobs/:id         → cancel and archive job
```

---

## Standard response envelope

Every endpoint returns this shape. The frontend expects this exactly.

```typescript
// Success
{
  statusCode: 200,
  message: 'Success',
  data: { ... }       // the actual payload
}

// Error
{
  statusCode: 400,
  message: 'Validation failed',
  errors: [ ... ]     // optional array of field errors
}
```

Implement via a global response interceptor in `common/interceptors/transform.interceptor.ts`.

---

## User roles

```typescript
enum UserRole {
  CUSTOMER = 'customer',
  CLERK    = 'clerk',
  ADMIN    = 'admin',
}
```

- `CUSTOMER` — can only see and create their own jobs
- `CLERK` — can view full queue, update job status, mark as paid
- `ADMIN` — everything CLERK can do + reports, settings, customer management

Guards: `JwtAuthGuard` on all protected routes, `RolesGuard` on admin routes.

---

## Job status lifecycle

```
pending → printing → ready → delivered
```

Payment status is separate from job status:

```
unpaid | paid | pay_on_pickup
```

A job with `paymentStatus: 'unpaid'` should NOT enter the print queue until paid.
A job with `paymentStatus: 'pay_on_pickup'` enters the queue immediately.
The admin marks `pay_on_pickup` jobs as `paid` when the customer arrives.

---

## Naming conventions

| Context         | Convention   | Example                          |
|-----------------|--------------|----------------------------------|
| TypeScript vars | camelCase    | `colorMode`, `deliveryType`      |
| MySQL columns   | snake_case   | `color_mode`, `delivery_type`    |
| Sequelize model | camelCase    | `field: 'color_mode'` in column options |
| API response    | camelCase    | matches frontend dummy data keys |
| File names      | kebab-case   | `jobs.service.ts`                |
| NestJS modules  | PascalCase   | `JobsModule`                     |
| Environment vars| SCREAMING_SNAKE | `MPESA_CONSUMER_KEY`          |

---

## Environment variables required

```env
# App
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_NAME=printease

# JWT
JWT_ACCESS_SECRET=change_this_secret
JWT_REFRESH_SECRET=change_this_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# M-Pesa Daraja
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=https://your-ngrok-url.ngrok.io/api/payments/mpesa/callback
MPESA_ENVIRONMENT=sandbox   # sandbox | production

# Africa's Talking (SMS)
AT_USERNAME=sandbox
AT_API_KEY=

# WhatsApp
WHATSAPP_API_URL=
WHATSAPP_TOKEN=

# File storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=20

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

---

## What the agent must never do

- Never put business logic inside a controller — controllers receive, validate, delegate, respond only
- Never skip DTOs — every request body must have a DTO with class-validator decorators
- Never hardcode credentials, URLs, or secrets — always use ConfigService
- Never write raw SQL — use Sequelize model methods or query interface
- Never modify the frontend code unless explicitly told to
- Never change field names in API responses without updating dummy.js to match
- Never create a new module without a corresponding entry in AppModule imports
