# Database Schema — PrintEase MySQL

> This is the authoritative database design.
> All Sequelize models must match these tables exactly.
> Column names in MySQL are snake_case. TypeScript properties are camelCase (use `field:` option in column definitions).

---

## Database name

```
printease
```

---

## Tables overview

| Table                | Purpose                                          |
|----------------------|--------------------------------------------------|
| `users`              | All users: customers, clerks, admins             |
| `jobs`               | Print job records                                |
| `files`              | Uploaded file metadata                           |
| `payments`           | Payment records linked to jobs                   |
| `refresh_tokens`     | JWT refresh token store (for logout/blacklist)   |
| `push_subscriptions` | Web Push subscription endpoints per user         |
| `notifications_log`  | Record of every notification sent (push/SMS/WA)  |

---

## Table: `users`

```sql
CREATE TABLE users (
  id             VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  name           VARCHAR(255) NOT NULL,
  phone          VARCHAR(20)  NOT NULL UNIQUE,
  house_number   VARCHAR(20)  NOT NULL,
  estate         VARCHAR(255) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  role           ENUM('customer', 'clerk', 'admin') NOT NULL DEFAULT 'customer',
  notif_sms      BOOLEAN      NOT NULL DEFAULT TRUE,
  notif_whatsapp BOOLEAN      NOT NULL DEFAULT FALSE,
  credit_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  loyalty_points INT          NOT NULL DEFAULT 0,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Sequelize model property mapping:**

| MySQL column     | TypeScript property  |
|------------------|----------------------|
| `id`             | `id`                 |
| `name`           | `name`               |
| `phone`          | `phone`              |
| `house_number`   | `houseNumber`        |
| `estate`         | `estate`             |
| `password_hash`  | `passwordHash`       |
| `role`           | `role`               |
| `notif_sms`      | `notifSms`           |
| `notif_whatsapp` | `notifWhatsapp`      |
| `credit_balance` | `creditBalance`      |
| `loyalty_points` | `loyaltyPoints`      |
| `created_at`     | `createdAt`          |
| `updated_at`     | `updatedAt`          |

---

## Table: `jobs`

```sql
CREATE TABLE jobs (
  id              VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  user_id         VARCHAR(36)  NOT NULL,
  file_id         VARCHAR(36)  NULL,
  file_name       VARCHAR(500) NULL,
  file_key        VARCHAR(1000) NULL,  -- MinIO object key for the original file
  instructions    TEXT         NULL,
  pages           INT          NOT NULL DEFAULT 1,
  copies          INT          NOT NULL DEFAULT 1,
  color_mode      ENUM('bw', 'color') NOT NULL DEFAULT 'bw',
  sides           ENUM('single', 'double') NOT NULL DEFAULT 'single',
  paper_size      VARCHAR(20)  NOT NULL DEFAULT 'A4',
  delivery_type   ENUM('pickup', 'delivery') NOT NULL DEFAULT 'pickup',
  payment_method  ENUM('mpesa', 'pay_on_pickup') NOT NULL DEFAULT 'mpesa',
  payment_status  ENUM('unpaid', 'paid', 'pay_on_pickup') NOT NULL DEFAULT 'unpaid',
  status          ENUM('pending', 'printing', 'ready', 'delivered') NOT NULL DEFAULT 'pending',
  cost            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  delivery_fee    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  mpesa_ref       VARCHAR(50)  NULL,
  admin_notes     TEXT         NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_payment_status (payment_status),
  INDEX idx_created_at (created_at)
);
```

**Sequelize model property mapping:**

| MySQL column      | TypeScript property  |
|-------------------|----------------------|
| `id`              | `id`                 |
| `user_id`         | `userId`             |
| `file_id`         | `fileId`             |
| `file_name`       | `fileName`           |
| `file_key`        | `fileKey`            |
| `instructions`    | `instructions`       |
| `pages`           | `pages`              |
| `copies`          | `copies`             |
| `color_mode`      | `colorMode`          |
| `sides`           | `sides`              |
| `paper_size`      | `paperSize`          |
| `delivery_type`   | `deliveryType`       |
| `payment_method`  | `paymentMethod`      |
| `payment_status`  | `paymentStatus`      |
| `status`          | `status`             |
| `cost`            | `cost`               |
| `delivery_fee`    | `deliveryFee`        |
| `mpesa_ref`       | `mpesaRef`           |
| `admin_notes`     | `adminNotes`         |
| `created_at`      | `createdAt`          |
| `updated_at`      | `updatedAt`          |

---

## Table: `files`

> `file_key` and `pdf_key` store MinIO object keys (e.g. `originals/userId/uuid.pdf`).
> Presigned URLs are generated at runtime — never stored in the DB.

```sql
CREATE TABLE files (
  id            VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  user_id       VARCHAR(36)   NOT NULL,
  original_name VARCHAR(500)  NOT NULL,
  stored_name   VARCHAR(500)  NOT NULL,
  mime_type     VARCHAR(100)  NOT NULL,
  size_bytes    INT           NOT NULL,
  page_count    INT           NOT NULL DEFAULT 1,
  file_key      VARCHAR(1000) NOT NULL,   -- MinIO object key for original file
  pdf_key       VARCHAR(1000) NULL,       -- MinIO object key for converted PDF
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);
```

**Sequelize model property mapping:**

| MySQL column    | TypeScript property  |
|-----------------|----------------------|
| `original_name` | `originalName`       |
| `stored_name`   | `storedName`         |
| `mime_type`     | `mimeType`           |
| `size_bytes`    | `sizeBytes`          |
| `page_count`    | `pageCount`          |
| `file_key`      | `fileKey`            |
| `pdf_key`       | `pdfKey`             |
| `created_at`    | `createdAt`          |

---

## Table: `payments`

```sql
CREATE TABLE payments (
  id              VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  job_id          VARCHAR(36)   NOT NULL UNIQUE,
  user_id         VARCHAR(36)   NOT NULL,
  method          ENUM('mpesa', 'cash', 'pay_on_pickup') NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  status          ENUM('pending', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
  mpesa_ref       VARCHAR(50)   NULL,
  mpesa_receipt   VARCHAR(100)  NULL,
  phone           VARCHAR(20)   NULL,
  merchant_req_id VARCHAR(100)  NULL,   -- used to match STK Push callback
  checkout_req_id VARCHAR(100)  NULL,   -- Daraja CheckoutRequestID
  result_code     VARCHAR(10)   NULL,   -- Daraja result code from callback
  result_desc     VARCHAR(500)  NULL,   -- Daraja result description
  paid_at         DATETIME      NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_checkout_req_id (checkout_req_id),
  INDEX idx_mpesa_ref (mpesa_ref)
);
```

The `checkout_req_id` index is critical — Daraja's callback identifies the payment using `CheckoutRequestID` and we need to find the payment record fast.

---

## Table: `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
  id           VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  user_id      VARCHAR(36)  NOT NULL,
  token_hash   VARCHAR(255) NOT NULL UNIQUE,
  expires_at   DATETIME     NOT NULL,
  revoked      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_token_hash (token_hash)
);
```

Store a hash of the token, not the token itself. On refresh, hash the incoming token and look it up.

---

## Table: `push_subscriptions`

Stores Web Push API subscription objects per user. One row per active browser/device.
Replacing a subscription (re-subscribing) deletes the old row for that user and inserts a new one.

```sql
CREATE TABLE push_subscriptions (
  id         VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id    VARCHAR(36) NOT NULL,
  endpoint   TEXT        NOT NULL,   -- browser-generated push URL
  p256dh     TEXT        NOT NULL,   -- ECDH public key
  auth       TEXT        NOT NULL,   -- authentication secret
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);
```

**Sequelize model:** `src/modules/push/models/push-subscription.model.ts`

**Sequelize model property mapping:**

| MySQL column | TypeScript property |
|--------------|---------------------|
| `user_id`    | `userId`            |
| `endpoint`   | `endpoint`          |
| `p256dh`     | `p256dh`            |
| `auth`       | `auth`              |
| `created_at` | `createdAt`         |

---

## Table: `notifications_log`

Records every notification attempt regardless of outcome. The `job_id` column is a plain string (no FK) until the `jobs` table is built.

```sql
CREATE TABLE notifications_log (
  id          VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  job_id      VARCHAR(36)  NOT NULL,
  user_id     VARCHAR(36)  NOT NULL,
  channel     ENUM('sms', 'whatsapp', 'push') NOT NULL,
  trigger     VARCHAR(100) NOT NULL,
  phone       VARCHAR(20)  NULL,        -- NULL for push channel
  message     TEXT         NOT NULL,
  status      ENUM('sent', 'failed') NOT NULL DEFAULT 'sent',
  provider_id VARCHAR(200) NULL,        -- AT message ID or push endpoint hash
  sent_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_job_id (job_id)
);
```

> Note: `job_id` has no FK constraint yet because the `jobs` table is not yet built.
> Add the FK (`REFERENCES jobs(id) ON DELETE CASCADE`) when the jobs module is implemented.

**Sequelize model property mapping:**

| MySQL column  | TypeScript property |
|---------------|---------------------|
| `job_id`      | `jobId`             |
| `user_id`     | `userId`            |
| `channel`     | `channel`           |
| `trigger`     | `trigger`           |
| `phone`       | `phone`             |
| `message`     | `message`           |
| `status`      | `status`            |
| `provider_id` | `providerId`        |
| `sent_at`     | `sentAt`            |

---

## Pricing logic (implemented in JobsService)

```typescript
const PRICING = {
  bwPerPage:    5,    // KES per page black & white
  colorPerPage: 20,   // KES per page colour
  doubleSidedMultiplier: 1.8,
  deliveryFee:  50,   // KES flat delivery fee
};

function calculateCost(pages, copies, colorMode, sides, deliveryType): number {
  const perPage = colorMode === 'color' ? PRICING.colorPerPage : PRICING.bwPerPage;
  const sidesMult = sides === 'double' ? PRICING.doubleSidedMultiplier : 1;
  const printCost = Math.round(pages * copies * perPage * sidesMult);
  const deliveryFee = deliveryType === 'delivery' ? PRICING.deliveryFee : 0;
  return printCost + deliveryFee;
}
```

This must match `calculateCost()` in `frontend/src/data/dummy.js` exactly.

---

## Migration strategy

Use Sequelize `synchronize: true` in development (auto-creates tables).
Use Sequelize CLI migrations for production schema changes.

```bash
npx sequelize-cli migration:generate --name add-job-status-index
npx sequelize-cli db:migrate
npx sequelize-cli db:migrate:undo
```

Never use `sync({ force: true })` in production.

---

## Seed data (for development)

```
Admin:    phone 0700000000, password admin, role admin
Customer: phone 0712345678, password password, role customer, houseNumber 14B, estate Westlands Gardens
```

Run with: `npm run seed` (from `kaban-backend/`)
