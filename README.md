# FinTrack — Finance Dashboard Backend

A backend system for a multi-role finance dashboard. Built with **Node.js**, **Express**, **Prisma ORM**, and **MySQL**.

---

## 🏗️ Detailed Documentation

For deep-dives into the architecture and data models, please refer to the following:

- **[Database Schema Documentation](./schema_documentation.md)**: ER diagrams, Enum definitions, and model structures.
- **[Core Features & Architecture](./core_features.md)**: Insights into JWT blacklisting, bulk import workflows, secure file parsing, and scalability tradeoffs.

---

## 📌 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [API Reference](#api-reference)
- [Access Control Matrix](#access-control-matrix)
- [Setup & Running Locally](#setup--running-locally)
- [Assumptions & Tradeoffs](#assumptions--tradeoffs)
- [Assignment Checklist](#assignment-checklist)

---

## 🚀 Project Overview

FinTrack is a backend API that enables a finance team to manage financial records, users, and roles — with a layered dashboard that surfaces aggregated data for different stakeholders.

The system enforces strict role-based access at every layer: route middleware, service logic, and data-shaping (DTOs). Different user roles receive different data — not just different permissions — from the same endpoints.

---

## 🛠️ Tech Stack

| Layer         | Technology                       |
|---------------|----------------------------------|
| Runtime       | Node.js (CommonJS)               |
| Framework     | Express v5                       |
| ORM           | Prisma v6                        |
| Database      | MySQL (via Prisma)               |
| Validation    | Zod                              |
| Auth          | JWT (jsonwebtoken) + bcrypt      |
| Documentation | Swagger (UI Express)             |

---

## 🏛️ System Architecture

The project follows a strict layered architecture:

```
Request → Middleware → Controllers → Services → Repositories → MySQL
```

- **Routes**: Define HTTP methods, paths, and middleware chains.
- **Middleware**: Handles Authentication (JWT), RBAC (Authorize), and Security checks.
- **Controllers**: Parse input, validate requests via Zod, and return formatted responses.
- **Services**: Orchestrate business logic, audit triggers, and role-based data shaping.
- **Repositories**: Dedicated layer for all Prisma queries to keep data access isolated.

---

## API Reference

Full request/response documentation with examples: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

Interactive docs (Swagger UI): `http://localhost:8000/api/v1/docs`

| Category | Base Path | Description |
|----------|-----------|-------------|
| Auth | `/api/v1/auth` | Login, register, logout, change password |
| Users | `/api/v1/users` | Profile management, role/status updates |
| Records | `/api/v1/records` | Financial record CRUD with filtering |
| Bulk Import | `/api/v1/bulk-records` | CSV/XLSX imports, sync and async, job tracking |
| Dashboard | `/api/v1/dashboard` | Aggregated summaries, trends, insights, comparisons |

---

## 🔐 Access Control Matrix

| Action                          | ADMIN | ANALYST | VIEWER |
|---------------------------------|-------|---------|--------|
| Create / Update / Delete Record | ✅    | ❌      | ❌     |
| Bulk Import Records             | ✅    | ❌      | ❌     |
| Read Records                    | ✅    | ✅      | ✅     |
| View Full Metadata (DTOs)       | ✅    | ✅      | ❌     |
| Manage Users (Role, Status)     | ✅    | ❌      | ❌     |
| Dashboard Summary               | ✅    | ✅      | ✅     |
| Trends / Insights / Comparison  | ✅    | ✅      | ❌     |

---

## ⚙️ Setup & Running Locally

### 1. Prerequisites
- Node.js 18+
- MySQL database (local or remote)

### 2. Steps

```bash
# Clone the repository
git clone https://github.com/PratikBhopi/screening-test.git
cd screening-test

# Install dependencies
npm install

# Configure environment (.env)
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Run database migrations
npx prisma migrate dev

# Start the development server
npm run dev
```

### 3. Environment Variables
- `DATABASE_URL`: Connection string for your MySQL instance.
- `PORT`: (Optional) Server port, defaults to `8000`.
- `JWT_SECRET`: Secret key for token signing.
- `JWT_EXPIRES_IN`: Token validity (e.g., `24h`).

---

## 📉 Assumptions & Tradeoffs

| Topic | Note |
|-------|------|
| **JWT Blacklist** | Currently in-process (Memory). Production path to **Redis** is documented in [Core Features](./core_features.md). |
| **Imports** | Sync (<1MB) for speed; Async (<10MB) for server reliability. Production uses **BullMQ/SQS**. |
| **Categories** | Denormalized (String) for high-speed SQL-level aggregations without JOIN overhead. |
| **Soft Delete** | Only on `FinancialRecord` to maintain audit trail integrity. |

---

## ✅ Assignment Checklist

- ✅ **User and Role Management** (ADMIN/ANALYST/VIEWER)
- ✅ **Financial Records CRUD** & **Filtering**
- ✅ **Dashboard Summary APIs** (Income/Expense/Net)
- ✅ **Insights & Period Comparison**
- ✅ **Role-Based Access Control** (Routes + DTOs)
- ✅ **JWT Authentication** & **Logout Blacklisting**
- ✅ **Audit Logging** (Non-volatile change snapshots)
- ✅ **Bulk Imports** (Sync/Async with Job Tracking)
- ✅ **Interactive Documentation** (Swagger)