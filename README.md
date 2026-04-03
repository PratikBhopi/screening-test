# FinTrack — Finance Dashboard Backend

A backend system for a multi-role finance dashboard. Built with **Node.js**, **Express**, **Prisma ORM**, and **MySQL**.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Data Model](#data-model)
- [API Reference](#api-reference)
- [Access Control Matrix](#access-control-matrix)
- [Security Design](#security-design)
- [Extra Features & First-Principles Thinking](#extra-features--first-principles-thinking)
- [Setup & Running Locally](#setup--running-locally)
- [Assumptions & Tradeoffs](#assumptions--tradeoffs)
- [Assignment Checklist](#assignment-checklist)

---

## Project Overview

FinTrack is a backend API that enables a finance team to manage financial records, users, and roles — with a layered dashboard that surfaces aggregated data for different stakeholders.

The system enforces strict role-based access at every layer: route middleware, service logic, and data-shaping (DTOs). Different user roles receive different data — not just different permissions — from the same endpoints.

---

## Tech Stack

| Layer         | Technology                       |
|---------------|----------------------------------|
| Runtime       | Node.js (CommonJS)               |
| Framework     | Express v5                       |
| ORM           | Prisma v6                        |
| Database      | MySQL                            |
| Validation    | Zod                              |
| Auth          | JWT (jsonwebtoken) + bcrypt      |
| Dev Server    | Nodemon                          |

---

## System Architecture

The project follows a strict layered architecture. Each layer has a single responsibility and no layer reaches past its neighbour.

```
Request
  │
  ▼
Routes          → define HTTP method, path, and middleware chain
  │
  ▼
Middleware      → authenticate (JWT), requirePasswordChange, authorize (RBAC)
  │
  ▼
Controllers     → parse & validate input (Zod), call service, return response
  │
  ▼
Services        → business logic, orchestration, shaping via DTOs
  │
  ▼
Repositories    → all Prisma queries live here, no logic
  │
  ▼
Database (MySQL via Prisma)
```

```
src/
├── app.js                  # Express app setup, global middleware, route mounting
├── controllers/            # HTTP layer — input parsing, response formatting
├── services/               # Business logic — rules, role shaping, audit triggers
├── repositories/           # Data access — all Prisma queries live here
├── middleware/             # authenticate, authorize, requirePasswordChange
├── dtos/                   # Data Transfer Objects — shape responses per role
├── validations/            # Zod schemas — one file per domain
├── routes/                 # Route definitions with middleware chains
├── models/                 # Prisma client singleton
├── utils/                  # tokenBlacklist, asyncHandler, generateTempPassword
├── errors/                 # AppError class for operational errors
└── prisma/                 # schema.prisma + migrations
```

**Why this structure?**  
The repository layer means Prisma is never called from a service or controller directly (except for one intentional dashboard case using `prisma.$queryRaw` for SQL-level aggregations). This makes the system testable and the data access layer swappable.

---

## Data Model

```
User
 ├── id (UUID)
 ├── username (unique)
 ├── email (unique)
 ├── passwordHash
 ├── role: ADMIN | ANALYST | VIEWER
 ├── status: ACTIVE | INACTIVE | SUSPENDED
 └── mustChangePassword: Boolean

Category
 ├── id (autoincrement)
 ├── name (unique)
 └── typeHint: INCOME | EXPENSE | BOTH   ← enables fast dashboard aggregation

FinancialRecord
 ├── id (UUID)
 ├── amount (Decimal 19,4)
 ├── type: INCOME | EXPENSE
 ├── transactionDate (required — no default to avoid silent data issues)
 ├── description?
 ├── categoryId → Category
 ├── createdById → User
 └── deletedAt?  ← soft delete (single field, not isDeleted + deletedAt)

AuditLog
 ├── id (BigInt autoincrement)
 ├── userId? (nullable — survives if user is ever removed)
 ├── action, entityType, entityId
 ├── oldValue (JSON), newValue (JSON)
 └── ipAddress
```

**Design notes:**
- `transactionDate` has no default. Defaulting to `now()` would silently accept records with missing dates.
- Soft delete uses a single `deletedAt` field. Having both `isDeleted` and `deletedAt` creates split-brain where one field disagrees with the other.
- `Category.typeHint` lets the dashboard bucket records without scanning every `FinancialRecord.type` field.
- `AuditLog.entityId` is a `String` (not typed FK) because it must hold both UUIDs and integers from different tables.

---

## API Reference

### Authentication — `/api/v1/auth`

| Method | Path                   | Auth Required | Description                        |
|--------|------------------------|---------------|------------------------------------|
| POST   | `/register`            | No            | Admin creates a user (no password input) |
| POST   | `/login`               | No            | Returns JWT token                  |
| PATCH  | `/change-password`     | JWT           | Change password (temp or voluntary) |
| POST   | `/logout`              | JWT           | Invalidates the token              |

### Users — `/api/v1/users`

| Method | Path             | Role    | Description              |
|--------|------------------|---------|--------------------------|
| GET    | `/`              | ADMIN   | List all users           |
| GET    | `/me`            | Any     | Current user profile     |
| GET    | `/:id`           | ADMIN   | Get user by ID           |
| PATCH  | `/:id/role`      | ADMIN   | Update a user's role     |
| PATCH  | `/:id/status`    | ADMIN   | Activate / suspend user  |

### Financial Records — `/api/v1/records`

| Method | Path    | Role              | Description                         |
|--------|---------|-------------------|-------------------------------------|
| POST   | `/`     | ADMIN             | Create a record                     |
| GET    | `/`     | All               | List records (paginated, filtered)  |
| GET    | `/:id`  | All               | Get single record                   |
| PATCH  | `/:id`  | ADMIN             | Update a record                     |
| DELETE | `/:id`  | ADMIN             | Soft delete a record                |

**Supported filters:** `type`, `categoryId`, `startDate`, `endDate`, `page`, `limit`

### Categories — `/api/v1/categories`

| Method | Path    | Role    | Description          |
|--------|---------|---------|----------------------|
| POST   | `/`     | ADMIN   | Create a category    |
| GET    | `/`     | All     | List all categories  |
| PATCH  | `/:id`  | ADMIN   | Update a category    |

### Dashboard — `/api/v1/dashboard`

| Method | Path            | Role             | Description                             |
|--------|-----------------|------------------|-----------------------------------------|
| GET    | `/`             | All              | Full dashboard (role-shaped)            |
| GET    | `/summary`      | All              | Total income, expenses, net balance     |
| GET    | `/categories`   | ADMIN, ANALYST   | Category-wise totals with percentages   |
| GET    | `/trends`       | ADMIN, ANALYST   | Monthly or weekly income/expense trends |
| GET    | `/insights`     | ADMIN, ANALYST   | Rule-based financial health alerts      |
| GET    | `/compare`      | ADMIN, ANALYST   | Period-over-period comparison           |

---

## Access Control Matrix

| Action                          | ADMIN | ANALYST | VIEWER |
|---------------------------------|-------|---------|--------|
| Create / Update / Delete Record | ✅    | ❌      | ❌     |
| Read Records                    | ✅    | ✅      | ✅     |
| View record description & audit | ✅    | ✅      | ❌     |
| Manage Users (role, status)     | ✅    | ❌      | ❌     |
| Dashboard Summary               | ✅    | ✅      | ✅     |
| Category Breakdown / Trends     | ✅    | ✅      | ❌     |
| Insights / Comparison           | ✅    | ✅      | ❌     |
| Create Categories               | ✅    | ❌      | ❌     |

**Role-shaped responses:** The `GET /dashboard` and `GET /records` endpoints return structurally different responses depending on the caller's role. VIEWERs receive only the summary block from the dashboard. Their record responses omit `description`, `createdBy`, and timestamps. This is handled via DTOs in the service layer — the same endpoint, different output.

---

## Security Design

### Temporary Password & Forced Password Change

When an Admin registers a user, the system generates the password internally using `crypto.randomInt` — Admins never define or see the intended user's credentials. The generated password:
- Is cryptographically random (10 characters with forced character class diversity)
- Is printed to the server console and returned once in the register response to simulate email delivery
- Immediately marks the user as `mustChangePassword: true`

Every protected route is guarded by `requirePasswordChange` middleware. Until the user calls `PATCH /auth/change-password` with their temporary credential, every API request returns `403`. The change-password route itself is exempt to avoid a deadlock.

**In production:** The password would be delivered exclusively via a transactional email provider (e.g. SendGrid, AWS SES) and would never appear in any API response.

**Password Change Validation (Zod):**
- New password must be at least 8 characters with 1 uppercase and 1 number
- New password must not be the same as the current (temporary) password
- Confirmation field must match

### JWT Blacklisting on Logout

JWT is stateless by design — once issued, it's valid until expiry regardless of logout. To close this gap, logout adds the token's unique `jti` (JWT ID) to an in-memory `Map<jti, exp>`.

The `authenticate` middleware checks this Map on every request. A blacklisted token is rejected with `401` even if it has not yet expired.

**Cleanup:** A background job runs every 60 minutes and evicts entries where `exp` is in the past. This keeps the Map from growing indefinitely in long-running processes.

**Known limitation:** The Map lives in process memory. A server restart clears it, and it does not synchronise across multiple instances.

**Production upgrade path:** Replace the Map with Redis using `SET jti "" EX <remaining_lifetime>`. The architecture is identical — only the storage backend changes. The `jti`-based approach works in both environments.

### Audit Logging

Every write operation (create record, update record, delete record, change role, change status) writes a row to `AuditLog` with:
- Who did it (`userId`)
- What they did (`action`)
- What was changed (`oldValue`, `newValue` as JSON snapshots)
- Where from (`ipAddress`)

Audit logging is fire-and-forget — failures are caught and logged to console but never propagate to the caller. A failed audit entry must not roll back or fail the original business operation.

---

## Extra Features & First-Principles Thinking

### Why these extras were built

The assignment asked for a backend that shows how you *think*. The extras below were added not to pad the submission, but because each one addresses a real gap that the core requirements leave open.

---

**1. Cryptographic Temporary Password Generation**

The spec says "admin creates users." The first-principles question is: *who sets the initial password?*

Allowing admins to set user passwords is a security anti-pattern — it means an admin permanently knows a user's credential. The solution is to remove admins from the credential loop entirely. The system generates the password using `crypto.randomInt`, not `Math.random`, because `Math.random` is not cryptographically secure. The generated password is guaranteed to contain one character from each character class before the rest is filled randomly, then the array is Fisher-Yates shuffled.

---

**2. JWT Blacklisting**

Standard JWT is fully stateless — logout is a client-side operation (delete the cookie/token). This means a stolen token is valid until expiry. The `jti` blacklist makes logout a real server-side event. The tradeoff we accepted (in-memory) is documented — the production path to Redis is a one-file swap.

---

**3. Role-Shaped API Responses via DTOs**

The naive RBAC approach is: check role → return 403 or 200. The problem is that 200 may return fields the role should not see. VIEWERs should not see who created a record (`createdBy`), internal descriptions, or timestamps.

DTOs (`src/dtos/`) strip the response at the service layer before it reaches the controller. This means the database query returns full data (for caching friendliness), and the role-shaping happens in memory — one consistent place, not scattered across controllers.

---

**4. SQL-Level Dashboard Aggregations**

Dashboard endpoints do not load records into Node.js and aggregate them with `Array.reduce`. All `SUM`, `COUNT`, and `GROUP BY` operations are pushed to MySQL. The `GET /dashboard` endpoint fires five independent queries concurrently via `Promise.all`, so the total response time equals the slowest individual query, not the sum of all.

For the trends endpoint, `DATE_FORMAT` grouping (monthly/weekly) is not expressible through Prisma's ORM API, so `prisma.$queryRaw` with `Prisma.sql` template literals is used — never string concatenation, to prevent SQL injection.

---

**5. Rule-Based Financial Insights**

The `/dashboard/insights` endpoint implements four financial health rules computed from current and previous month data:

| Rule | Trigger |
|------|---------|
| `BURN_RATE` | Expenses grew >10% vs last month (`CRITICAL` if >25%) |
| `TOP_SPENDING_CATEGORY` | Reports the highest-spending category |
| `EXPENSE_INCOME_RATIO` | Expenses >75% of income = WARNING, >90% = CRITICAL |
| `NET_BALANCE_TREND` | Net balance shifted >5% vs last month |

Insights that don't trigger produce no entry in the array. This is not ML or AI — it is deterministic rule application on aggregated data, which is the appropriate tool for this use case.

---

**6. Soft Delete with Single-Field Design**

Records are soft-deleted using `deletedAt: DateTime?`. A common mistake is adding both an `isDeleted: Boolean` and a `deletedAt` field. This creates a split-brain state where `isDeleted = true` but `deletedAt = null` is a valid DB row. A single nullable timestamp is the single source of truth: `NULL` means active, non-null means deleted.

---

**7. Append-Only Audit Log**

Financial systems must be reconstructable. The `AuditLog` table stores before/after JSON snapshots for every write. Records are never updated or deleted from this table. The `entityId` column is `String` (not a foreign key) so audit entries survive even if the source row is removed. In practice, users are never hard-deleted, but the schema is resilient regardless.

---

## Setup & Running Locally

### Prerequisites
- Node.js 18+
- MySQL database (local or remote)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/PratikBhopi/screening-test.git
cd screening-test

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_ROUNDS

# 4. Run database migrations
npx prisma migrate dev

# 5. Start the development server
npm run dev
```

Server starts on `http://localhost:8000`.

### Environment Variables

```env
DATABASE_URL="mysql://user:password@localhost:3306/fintrack"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="24h"
BCRYPT_ROUNDS=12
```

### First Request Flow

```
1. POST /api/v1/auth/register      ← create first admin user
   → response includes temporaryPassword

2. POST /api/v1/auth/login         ← login with email + temporaryPassword
   → response includes token (but mustChangePassword = true)

3. PATCH /api/v1/auth/change-password  ← change to a real password
   → Authorization: Bearer <token>

4. POST /api/v1/auth/login         ← login again with new password
   → full access token

5. POST /api/v1/categories         ← create a category first
6. POST /api/v1/records            ← create financial records
7. GET  /api/v1/dashboard          ← view aggregated summary
```

An `api.http` file is included at the project root with ready-to-run sample requests for all endpoints.

---

## Assumptions & Tradeoffs

| Assumption / Tradeoff | Reasoning |
|-----------------------|-----------|
| In-memory JWT blacklist instead of Redis | The assignment explicitly permits in-memory stores. Production path to Redis is documented and architecturally straightforward. |
| Temporary password simulated via console + API response | Email delivery requires external service integration outside the assignment scope. The production path is noted in the security section. |
| No rate limiting | Out of scope for this assignment but standard for production (e.g., express-rate-limit). |
| No unit tests | The layered architecture (repositories separate from services) was designed with testability in mind. Each layer is independently mockable. |
| Soft delete only for FinancialRecord, not User | Users are deactivated via `status` field. Hard-deleting a user would break `AuditLog` foreign keys and the principle of financial traceability. |
| `transactionDate` has no server-side default | Silently defaulting to `now()` would mask missing data from callers. Every record must explicitly state when the transaction occurred. |

---

## Assignment Checklist

### Core Requirements

- ✅ **User and Role Management** — Create users, assign roles (ADMIN / ANALYST / VIEWER), manage status (ACTIVE / INACTIVE / SUSPENDED), restrict actions by role
- ✅ **Financial Records CRUD** — Create, read, update, soft-delete records with amount, type, category, date, and description
- ✅ **Record Filtering** — Filter by `type`, `categoryId`, `startDate`, `endDate` with `page` and `limit` pagination
- ✅ **Dashboard Summary APIs** — Total income, total expenses, net balance, transaction count, category-wise totals, recent activity, monthly/weekly trends
- ✅ **Role-Based Access Control** — Middleware-enforced at route level, with additional response shaping at the service/DTO level
- ✅ **Input Validation and Error Handling** — Zod schemas on all inputs, `AppError` class for operational errors, global error handler middleware, correctly mapped HTTP status codes
- ✅ **Data Persistence** — MySQL via Prisma ORM with full schema migrations

### Optional Enhancements

- ✅ **JWT Authentication** — Signed tokens with configurable expiry
- ✅ **Pagination** — `page` and `limit` on record listing
- ✅ **Soft Delete** — `deletedAt` pattern on FinancialRecord
- ✅ **Audit Logging** — Append-only AuditLog for every write operation
- ✅ **Temporary Password & Forced Reset Flow** — Cryptographically generated, must be changed on first login
- ✅ **JWT Blacklisting on Logout** — In-memory with background cleanup, documented Redis upgrade path
- ✅ **Rule-Based Insights** — Four financial health rules computed from period data
- ✅ **Period Comparison API** — Monthly, weekly, and quarterly period-over-period comparison
- ✅ **Role-Shaped Responses (DTOs)** — Same endpoint, structurally different output per role
