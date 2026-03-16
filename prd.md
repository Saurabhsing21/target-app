# Product Requirements Document
## Web Pentesting Target Application (Sacrificial App)

---

## 1. Overview

| Field | Details |
|---|---|
| **Document Version** | v1.0 |
| **Date** | March 16, 2026 |
| **Author** | Engineering Team |
| **Status** | Draft |
| **Classification** | Internal / Confidential |

### 1.1 Purpose
Build a realistic, full-stack web application with payment integration and standard backend APIs. This app will serve as a **target environment** for the founder's AI-powered web penetration testing tool to benchmark against — finding vulnerabilities that exist naturally in a standard codebase, not ones planted intentionally.

### 1.2 The Core Rule
> ❌ Do NOT intentionally plant bugs, weak credentials, or CTF-style traps.  
> ✅ Build it like a real developer would — clean, standard code. The pentesting tool must earn its findings.

---

## 2. Background & Goals

### Why This App Exists
The founder is building an **AI-powered web pentesting agent**. To validate and benchmark it, he needs a realistic target — a functioning SaaS/e-commerce style app that handles sensitive data like auth tokens, payments, and user records.

### What Success Looks Like
- The AI pentesting tool scans this app
- It finds **real, unintentional vulnerabilities** that commonly exist in standard codebases
- Results are used to benchmark the tool's accuracy and coverage

---

## 3. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| **Backend** | FastAPI (Python) | Fast, clean REST API, widely used |
| **Database** | PostgreSQL | Relational, supports complex queries |
| **Auth** | JWT (JSON Web Tokens) | Industry standard |
| **Payments** | Razorpay (Sandbox/Test Mode) | Common in Indian SaaS, realistic flow |
| **Frontend** | React + TailwindCSS | Modern, component-based UI |
| **Hosting** | Docker + any cloud | Easy to spin up and reset |

---

## 4. Core Features & API Modules

### 4.1 User Authentication Module
**Endpoints:**
- `POST /auth/register` — Create new user account
- `POST /auth/login` — Returns JWT access token
- `POST /auth/logout` — Invalidate token
- `GET /auth/me` — Get current logged-in user profile

**Expected standard behavior:**
- Password hashing with bcrypt
- JWT expiry set to 24 hours
- No role separation (all users are equal — admin vs user can be a stretch goal)

---

### 4.2 Product / Item Listing Module
**Endpoints:**
- `GET /products` — List all products (public)
- `GET /products/{id}` — Get single product detail
- `POST /products` — Create product (auth required)
- `PUT /products/{id}` — Update product (auth required)
- `DELETE /products/{id}` — Delete product (auth required)

**Data fields:** id, name, description, price, stock, created_by

---

### 4.3 Order Management Module
**Endpoints:**
- `POST /orders` — Create a new order (auth required)
- `GET /orders` — List orders for logged-in user
- `GET /orders/{id}` — Get specific order detail
- `PATCH /orders/{id}/cancel` — Cancel an order

**Key behavior:**
- An order belongs to a user
- Order total is calculated server-side from product price (not trusted from client)
- Order status: `pending → paid → shipped → delivered`

---

### 4.4 Payment Integration Module (Razorpay Sandbox)
**Flow:**
1. User places an order → backend creates Razorpay order via API
2. Frontend renders Razorpay checkout widget
3. User pays (test card in sandbox)
4. Razorpay sends webhook → backend verifies signature → marks order as `paid`

**Endpoints:**
- `POST /payments/create-order` — Initiates Razorpay order
- `POST /payments/verify` — Verifies payment signature from webhook
- `GET /payments/history` — Returns payment history for current user

**⚠️ Important:** Use only Razorpay **Test Mode** keys. Never use live keys.

---

### 4.5 User Profile & Data Module
**Endpoints:**
- `GET /users/{id}` — Get user profile by ID (auth required)
- `PUT /users/{id}` — Update user profile
- `GET /users/{id}/orders` — Get all orders of a user

**Note:** This module is where BOLA (Broken Object Level Authorization) vulnerabilities commonly appear naturally — user A accessing user B's data. Build it with standard access checks only.

---

## 5. Database Schema (Simplified)

```sql
users
  id, email, password_hash, name, created_at

products
  id, name, description, price, stock, created_by (FK users), created_at

orders
  id, user_id (FK users), total_amount, status, created_at

order_items
  id, order_id (FK orders), product_id (FK products), quantity, unit_price

payments
  id, order_id (FK orders), razorpay_order_id, razorpay_payment_id, status, created_at
```

---

## 6. Frontend Screens

| Screen | Description |
|---|---|
| `/register` | Signup form |
| `/login` | Login form |
| `/dashboard` | Product listing page |
| `/products/:id` | Product detail + Add to cart |
| `/cart` | Cart review |
| `/checkout` | Razorpay payment screen |
| `/orders` | Order history |
| `/profile` | User profile view/edit |

---

## 7. What the Pentesting Tool Will Test Against

| Vulnerability Class | Where It Could Naturally Appear |
|---|---|
| BOLA / IDOR | `GET /orders/{id}`, `GET /users/{id}/orders` |
| JWT Weaknesses | Auth module — weak secret, missing expiry check |
| Payment Bypass | Skipping `/payments/verify`, manipulating order total |
| SQL Injection | Any filter/search parameter on products or orders |
| Broken Auth | Missing auth checks on protected routes |
| Sensitive Data Exposure | API returning full user object, password hash leaks |
| Mass Assignment | `PUT /users/{id}` accepting unexpected fields |

---

## 8. Out of Scope

- ❌ Do NOT plant intentional bugs
- ❌ No admin panel (keep it simple)
- ❌ No real payments / live Razorpay keys
- ❌ No mobile app
- ❌ No CI/CD pipeline needed for v1

---

## 9. Milestones

| Phase | Deliverable | Timeline |
|---|---|---|
| **Phase 1** | FastAPI project setup + DB schema + Auth module | Week 1 |
| **Phase 2** | Products + Orders APIs | Week 2 |
| **Phase 3** | Razorpay sandbox integration + Payment APIs | Week 3 |
| **Phase 4** | React frontend (all screens) | Week 4 |
| **Phase 5** | Docker setup + hand off to founder for scanning | Week 5 |

---

## 10. Skills Required

| Skill | Why Needed |
|---|---|
| **FastAPI / Python** | Core backend framework |
| **PostgreSQL + SQLAlchemy** | Database ORM and schema management |
| **JWT Auth** | User session management |
| **Razorpay API** | Payment order creation + webhook verification |
| **React + TailwindCSS** | Frontend UI |
| **Docker** | Containerize app for easy deployment and reset |
| **REST API Design** | Clean endpoint structure |
| **Basic Security Awareness** | Know what NOT to intentionally add |

---

*v1.0 — Review with founder before development begins to confirm scope.*
