# Current Task — Session Briefing

> Rewrite this file at the start of EVERY agent session.
> The agent reads this first. Keep it short and ruthlessly specific.

---

## Active session

```
Date:          [27th july]
Phase:         Backend — Auth module
Active module: auth + users (model only)
```

---

## What we are building this session

The complete auth module for PrintEase. This includes:
- Customer self-registration and login at `/api/auth/*`
- Admin and clerk login at `/api/admin/auth/*`
- JWT access token (1 hour) + refresh token (30 days) stored in MySQL
- A seed script that creates the two development users

---

## What is already done — do not touch

- The Nuxt 3 frontend in `kaban-frontend/` — do not modify any frontend file
- All skill files in `.claude/commands/` — do not modify

---

## Files to create this session, in this order

1. `kaban-backend/src/modules/users/models/user.model.ts`
2. `kaban-backend/src/modules/auth/models/refresh-token.model.ts`
3. `kaban-backend/src/modules/auth/dto/customer-register.dto.ts`
4. `kaban-backend/src/modules/auth/dto/customer-login.dto.ts`
5. `kaban-backend/src/modules/auth/dto/admin-login.dto.ts`
6. `kaban-backend/src/modules/auth/dto/refresh-token.dto.ts`
7. `kaban-backend/src/modules/auth/dto/create-staff.dto.ts`
8. `kaban-backend/src/modules/auth/strategies/jwt.strategy.ts`
9. `kaban-backend/src/modules/auth/auth.service.ts`
10. `kaban-backend/src/modules/auth/auth.controller.ts`         ← customer routes
11. `kaban-backend/src/modules/auth/admin-auth.controller.ts`   ← admin routes
12. `kaban-backend/src/modules/auth/auth.module.ts`
13. `kaban-backend/src/common/guards/jwt-auth.guard.ts`
14. `kaban-backend/src/common/guards/roles.guard.ts`
15. `kaban-backend/src/common/decorators/current-user.decorator.ts`
16. `kaban-backend/src/common/decorators/roles.decorator.ts`
17. `kaban-backend/src/common/interceptors/transform.interceptor.ts`
18. `kaban-backend/src/common/filters/http-exception.filter.ts`
19. `kaban-backend/src/app.module.ts`                           ← registers AuthModule
20. `kaban-backend/src/main.ts`                                 ← global setup
21. `kaban-backend/src/database/seed.ts`                        ← seed script
22. `kaban-backend/package.json`                                ← add seed script entry

---

## Constraints for this session

- Follow `AUTH_MODULE.md` exactly — all DTOs, service methods, and controllers are fully specified there
- Follow `NESTJS_PATTERNS.md` for guards, decorators, interceptors, and main.ts setup
- Follow `DATABASE_SCHEMA.md` for column names and types in models
- Do not create the jobs, payments, files, admin, or notifications modules yet
- Do not add WebSockets
- Use Sequelize `sync({ alter: true })` in development (set in app.module.ts)
- Never put `passwordHash` in any API response — always destructure it out

---

## Key decisions already made — do not re-debate

- Two login routes: `/api/auth/login` (customer) and `/api/admin/auth/login` (staff)
- No OTP verification at signup — phone + password only
- Access token: 1 hour via `JWT_ACCESS_SECRET`
- Refresh token: 30 days via `JWT_REFRESH_SECRET`, stored as SHA-256 hash in DB
- Customers self-register; clerks and admins are created by admins only
- Phone normalized to `0XXXXXXXXX` format before storage
- bcrypt salt rounds: 12

---

## Environment variables needed (.env)

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_NAME=printease

JWT_ACCESS_SECRET=dev_access_secret_change_in_production
JWT_REFRESH_SECRET=dev_refresh_secret_change_in_production

FRONTEND_URL=http://localhost:3000
```

---

## Reference files the agent must read before writing any code

1. `.claude/commands/CURRENT_TASK.md`     ← this file
2. `.claude/commands/AUTH_MODULE.md`      ← complete implementation spec
3. `.claude/commands/NESTJS_PATTERNS.md`  ← module/controller/service patterns, main.ts, guards
4. `.claude/commands/DATABASE_SCHEMA.md`  ← model field names and column mappings

---

## Definition of done

Session is complete when ALL of these pass:

- [ ] `npm run start:dev` starts with no TypeScript errors
- [ ] `POST /api/auth/register` creates a customer, returns accessToken + refreshToken + user
- [ ] `POST /api/auth/login` returns tokens for phone `0712345678` / password `password`
- [ ] `POST /api/auth/login` returns 401 for wrong credentials
- [ ] `POST /api/admin/auth/login` returns tokens for phone `0700000000` / password `admin`
- [ ] `POST /api/admin/auth/login` returns 403 when a customer phone is used
- [ ] `POST /api/auth/refresh` returns a new accessToken
- [ ] `POST /api/auth/logout` sets revoked=true on the refresh token in the DB
- [ ] A route decorated with `@UseGuards(JwtAuthGuard)` returns 401 without a Bearer token
- [ ] `POST /api/admin/auth/create-staff` with admin token creates a clerk account
- [ ] `POST /api/admin/auth/create-staff` with customer token returns 403
- [ ] `npm run seed` creates both development users without error
- [ ] No `passwordHash` field appears in any API response
