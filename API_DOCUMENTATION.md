# API Documentation

Base URL: `http://localhost:8000/api/v1`

Interactive docs (Swagger UI): `http://localhost:8000/api/v1/docs`

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth

### POST /auth/register
Creates a new user. Admin only. Password is system-generated — never accepted from the request body.

**Request**
```json
{
  "name": "Jane Doe",
  "username": "jane",
  "email": "jane@company.com",
  "role": "ANALYST"
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "username": "jane", "email": "jane@company.com", "role": "ANALYST" },
    "temporaryPassword": "Xk9#mP2q",
    "note": "This password is shown once. In production it would be sent via email only."
  }
}
```

---

### POST /auth/login

**Request**
```json
{ "email": "jane@company.com", "password": "Xk9#mP2q" }
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": { "id": "uuid", "username": "jane", "role": "ANALYST", "mustChangePassword": true }
  }
}
```

If `mustChangePassword` is true, the user must call `PATCH /auth/change-password` before any other endpoint will work.

---

### PATCH /auth/change-password
Works for both first-login temp password changes and regular updates.

**Request**
```json
{
  "currentPassword": "Xk9#mP2q",
  "newPassword": "NewPass@1",
  "confirmPassword": "NewPass@1"
}
```

Password rules: min 8 chars, at least 1 uppercase, at least 1 number.

**Response 200**
```json
{ "success": true, "message": "Password changed successfully." }
```

---

### POST /auth/logout
Blacklists the current JWT so it can't be reused even before it expires.

**Response 200**
```json
{ "success": true, "message": "Logged out successfully." }
```

---

## Users

All user management endpoints are Admin only, except `GET /users/me`.

### GET /users/me
Returns the authenticated user's own profile. Available to any role.

**Response 200**
```json
{
  "success": true,
  "data": { "id": "uuid", "username": "jane", "email": "jane@company.com", "role": "ANALYST", "status": "ACTIVE" }
}
```

---

### GET /users
Returns all users. Passwords are never included.

**Response 200**
```json
{
  "success": true,
  "data": [ { "id": "uuid", "username": "jane", "role": "ANALYST", "status": "ACTIVE", ... } ]
}
```

---

### GET /users/:id

**Response 200** — same shape as above, single user object.
**Response 404** — user not found.

---

### PATCH /users/:id/role
Admin cannot change their own role.

**Request**
```json
{ "role": "VIEWER" }
```

Valid values: `ADMIN`, `ANALYST`, `VIEWER`

---

### PATCH /users/:id/status
Admin cannot change their own status.

**Request**
```json
{ "status": "INACTIVE" }
```

Valid values: `ACTIVE`, `INACTIVE`, `SUSPENDED`

---

## Financial Records

### POST /records
Admin only.

**Request**
```json
{
  "transactionRef": "TXN-2025-001",
  "amount": 5000,
  "type": "INCOME",
  "category": "Salary",
  "transactionDate": "2025-01-15",
  "description": "January salary"
}
```

- `transactionRef` — required, unique business reference (e.g. invoice number, bank ref), max 100 chars
- `amount` — positive number
- `type` — `INCOME` or `EXPENSE`
- `category` — 1–100 chars, free-form string
- `transactionDate` — required, ISO date string
- `description` — optional, max 500 chars

**Response 201**
```json
{
  "success": true,
  "data": { "id": "uuid", "amount": "5000.0000", "type": "INCOME", "category": "Salary", "transactionDate": "2025-01-15T00:00:00.000Z" }
}
```

ADMIN/ANALYST also receive `description`, `createdBy`, `createdAt`, `updatedAt`. VIEWER gets the base fields only.

---

### GET /records
Available to all roles. Response shape varies by role (see above).

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| `type` | string | Filter by `INCOME` or `EXPENSE` |
| `category` | string | Filter by category name |
| `startDate` | date | Filter from this date |
| `endDate` | date | Filter to this date |
| `page` | integer | Default: 1 |
| `limit` | integer | Default: 20, max: 100 |

**Response 200**
```json
{
  "success": true,
  "data": {
    "records": [ ... ],
    "total": 142,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

### GET /records/:id
Available to all roles.

**Response 404** if the record doesn't exist or has been soft-deleted.

---

### PATCH /records/:id
Admin only. Send only the fields you want to update — all fields are optional.

**Request**
```json
{ "amount": 5500, "description": "Updated salary" }
```

---

### DELETE /records/:id
Admin only. Soft delete — sets `deletedAt`, the row stays in the database for audit trail purposes.

**Response 200**
```json
{ "success": true, "data": { "message": "Record deleted successfully" } }
```

---

## Dashboard

All dashboard endpoints accept optional `startDate` / `endDate` query params to scope the data to a specific period. Without them, all records are included.

### GET /dashboard/summary
Available to all roles.

**Response 200**
```json
{
  "success": true,
  "data": {
    "totalIncome": "25000.00",
    "totalExpenses": "18000.00",
    "netBalance": "7000.00",
    "transactionCount": 42,
    "period": { "from": null, "to": null }
  }
}
```

---

### GET /dashboard/categories
Admin and Analyst only. Per-category totals with percentage of grand total.

**Query params:** `type` (optional, `INCOME` or `EXPENSE`), `startDate`, `endDate`

**Response 200**
```json
{
  "success": true,
  "data": [
    { "category": "Salary", "total": "15000.00", "transactionCount": 3, "percentageOfTotal": "60.0" },
    { "category": "AWS", "total": "3000.00", "transactionCount": 12, "percentageOfTotal": "12.0" }
  ]
}
```

---

### GET /dashboard/categories/trends
Admin and Analyst only. Time-series income/expense per category — designed for stacked or multi-line charts. All category arrays are aligned to the same `labels` array.

**Query params:** `from` (required), `to` (required), `groupBy` (`monthly` or `weekly`, default: `monthly`)

**Response 200**
```json
{
  "success": true,
  "data": {
    "groupBy": "monthly",
    "period": { "from": "2025-01-01", "to": "2025-06-30" },
    "labels": ["2025-01", "2025-02", "2025-03"],
    "categories": [
      { "category": "Salary", "income": [5000, 5000, 5000], "expense": [0, 0, 0] },
      { "category": "AWS", "income": [0, 0, 0], "expense": [800, 950, 1100] }
    ]
  }
}
```

---

### GET /dashboard/insights
Admin and Analyst only. Per-category profit/loss breakdown with a plain-English summary for each.

**Query params:** `startDate` (required), `endDate` (required)

**Response 200**
```json
{
  "success": true,
  "data": {
    "period": { "from": "2025-01-01", "to": "2025-03-31" },
    "overall": {
      "totalIncome": "15000.00",
      "totalExpenses": "8000.00",
      "net": "7000.00",
      "result": "profit",
      "transactionCount": 28,
      "summary": "2025-01-01 to 2025-03-31: income 15000.00, expenses 8000.00, net profit 7000.00."
    },
    "categories": [
      {
        "category": "AWS",
        "totalIncome": "0.00",
        "totalExpenses": "2850.00",
        "net": "-2850.00",
        "result": "loss",
        "transactionCount": 12,
        "summary": "AWS had 2850.00 in expenses with no income."
      }
    ],
    "generatedAt": "2025-04-05T10:00:00.000Z"
  }
}
```

---

### GET /dashboard/compare
Admin and Analyst only. Compares the current period against the previous one with percentage change deltas.

**Query params:** `period` (`monthly`, `weekly`, or `quarterly`), `date` (optional, defaults to today)

**Response 200**
```json
{
  "success": true,
  "data": {
    "currentPeriod": {
      "label": "April 2025",
      "from": "2025-04-01",
      "to": "2025-04-05",
      "totalIncome": "8000.00",
      "totalExpenses": "5500.00",
      "netBalance": "2500.00",
      "transactionCount": 14
    },
    "previousPeriod": {
      "label": "March 2025",
      "from": "2025-03-01",
      "to": "2025-03-31",
      "totalIncome": "6000.00",
      "totalExpenses": "4200.00",
      "netBalance": "1800.00",
      "transactionCount": 18
    },
    "changes": {
      "incomeChange": "33.3",
      "expenseChange": "30.9",
      "netChange": "38.8",
      "incomeDirection": "up",
      "expenseDirection": "up",
      "netDirection": "up"
    }
  }
}
```

`incomeChange` is null (and direction is `neutral`) when the previous period had zero income — avoids division by zero.

---

### GET /dashboard
All roles. Returns all dashboard blocks in one request. VIEWER receives only the `summary` block — the other blocks are not computed at all for that role.

**Query params:** `startDate`, `endDate`, `type`, `groupBy`, `recentLimit` (default: 10)

---

## Bulk Import

All bulk import endpoints are Admin only. Accepted file formats: CSV, XLSX.

All bulk import endpoints are Admin only. Accepted file formats: CSV, XLSX. All imports are atomic — if any row fails validation, nothing is saved.

---

### POST /bulk-records
Synchronous import. Files up to 1MB / 1000 rows. Processes inline and responds immediately.

**Request** — `multipart/form-data`, field name: `file`

**Response 201**
```json
{
  "success": true,
  "data": {
    "totalRows": 150,
    "savedCount": 148,
    "failedCount": 2,
    "errors": [
      { "row": 45, "field": "amount", "message": "Amount must be greater than 0" },
      { "row": 98, "field": "transactionDate", "message": "Invalid date" }
    ]
  }
}
```

If the file exceeds 1MB or 1000 rows, the endpoint returns 400 and tells you to use the async endpoint instead.

---

### POST /bulk-records/async
Asynchronous import. Files up to 10MB. Stores the file, creates a job, and returns immediately. Processing happens in the background. Always runs in atomic mode — if any row fails validation, the entire import is rejected and the job is marked `FAILED`.

**Request** — same as sync, `multipart/form-data`

**Response 202**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid",
    "status": "PENDING",
    "message": "File queued. Poll GET /bulk-records/jobs/<jobId> for status."
  }
}
```

---

### GET /bulk-records/jobs/:jobId
Poll this after an async import to check progress.

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "transactions_q1.csv",
    "status": "COMPLETED",
    "totalRows": 980,
    "savedCount": 975,
    "failedCount": 5,
    "errorLog": [ ... ],
    "startedAt": "2025-04-05T10:01:00.000Z",
    "completedAt": "2025-04-05T10:01:08.000Z",
    "createdAt": "2025-04-05T10:00:58.000Z"
  }
}
```

Possible `status` values: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`

Returns 404 if the job doesn't exist or belongs to a different user.

---

### GET /bulk-records/jobs
Paginated list of your own import jobs, newest first.

**Query params:** `page` (default: 1), `limit` (default: 20, max: 50)

---

## Error Responses

All errors follow the same shape:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "amount", "message": "Amount must be greater than 0" },
    { "field": "transactionDate", "message": "Required" }
  ]
}
```

`errors` array is only present on validation failures (400). Other errors return just `success` and `message`.

| Status | Meaning |
|--------|---------|
| 400 | Validation error or bad request |
| 401 | Missing, invalid, or expired token |
| 403 | Valid token but insufficient role, or mustChangePassword is true |
| 404 | Resource not found |
| 409 | Conflict (e.g. email already registered) |
| 500 | Unexpected server error |
