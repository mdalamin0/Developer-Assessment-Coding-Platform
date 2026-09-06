# 🧠 Developer Assessment & Coding Platform — Backend API

A production-grade REST API backend powering an online technical assessment and coding platform. It enables **Recruiters** to create and publish assessments (with MCQ, written and coding problems), invite **Candidates**, and manage the full lifecycle — from problem banks and timed attempts to automated/manual evaluation and result generation — while **Admins** oversee users and audit the platform.

This is a **backend-only** repository. Everything is built with **TypeScript**, **Express**, **Prisma (PostgreSQL)**, **Redis**, and integrated with **Google OAuth**, **Cloudinary**, **Nodemailer (Gmail)** and **bKash** payment gateway.

---

## 🌐 Live Demo & Links

| Resource | URL |
| --- | --- |
| 🔗 GitHub Repository | [https://github.com/mdalamin0/Developer-Assessment-Coding-Platform](https://github.com/mdalamin0/Developer-Assessment-Coding-Platform) |
| 🧾 Postman Collection | `postman/collection.json` (included in the repo) |
| 🚀 Local API Base URL | `http://localhost:5000/api/v1` |
| 💡 Health Check (Root) | `GET http://localhost:5000/` |

> Each module is mounted under the `/api/v1` prefix (e.g. `/api/v1/auth`, `/api/v1/assessments`, `/api/v1/payments`, ...).

---

## 🛠️ Main Technologies

- **Node.js** + **Express** (v5) — web framework
- **TypeScript** — type-safe development
- **Prisma ORM** — data access, with **PostgreSQL** database
- **Redis** — OTP storage, session/token caching, bKash token caching
- **Passport.js** — authentication strategies (`passport-local`, `passport-google-oauth20`)
- **JWT** — stateless access & refresh token authentication
- **bKash Tokenized Checkout** — payment gateway integration
- **Zod** — request validation
- **Nodemailer + EJS** — transactional email templates

---

## ✨ Key Features

- **Role-based access control** with three roles: `CANDIDATE`, `RECRUITER`, `ADMIN`
- **Authentication flows**
  - Credential-based registration with **email OTP verification** (stored in Redis)
  - **Google OAuth 2.0** sign-in (seamlessly links/creates accounts)
  - Login / Logout with **httpOnly cookies** + JWT access & refresh tokens
  - **Forgot / Reset password** via email OTP
- **User profiles** — profile image upload (Cloudinary), candidate resume & skills, recruiter company profile
- **Problem bank** — Recruiters manage problems of type `MCQ`, `WRITTEN` and `CODING`
- **Assessment engine**
  - Build assessments, attach problems, set question order, duration, total & passing marks
  - **Publish** only after successful **bKash payment** of the assessment publish fee
  - Automatic lifecycle: `DRAFT → PUBLISHED → ONGOING → COMPLETED / ARCHIVED` (via cron)
- **Candidate invitations** — invite candidates by email, accepted/declined/expired lifecycle, expiry validation
- **Timed attempts** — candidates take time-limited attempts with automatic expiry handling; auto-submit via cron when time runs out
- **Answer management**
  - MCQ answers auto-graded for correctness
  - Written & coding answers manually rated by the recruiter
  - Result auto-computed as **READY** once all subjective answers are evaluated
- **Results** — score, percentage, pass/fail and `PROCESSING / READY` status
- **Recruiter dashboard** — aggregated stats (assessments, candidates, attempts, pending evaluations, average score) and per-assessment statistics
- **Admin panel** — manage all users, activate/suspend accounts, view the full **audit log**
- **Audit logging** — tracks `CREATE`, `UPDATE`, `DELETE`, `PUBLISH`, `INVITE`, `SUBMIT`, `EVALUATE`, `SUSPEND`, `ACTIVATE` and `PAYMENT_COMPLETED` actions
- **Security** — `Helmet`, global **rate limiting**, JWT verification, role guards, input validation via Zod, centralized error handling
- **Scheduled jobs (node-cron)** — assessment status sync, invitation expiry, and auto-submit of expired attempts
- **Transactional email templates** — registration OTP, welcome, invitation, forgot/reset password (EJS)

---

## 📦 Dependencies

**Runtime (`dependencies`):**

| Package | Purpose |
| --- | --- |
| `express` | Web framework |
| `@prisma/client` / `@prisma/adapter-pg` | Prisma ORM + PostgreSQL driver adapter |
| `redis` | In-memory store (OTPs, tokens, caches) |
| `jsonwebtoken` | JWT signing & verification |
| `bcryptjs` | Password hashing |
| `passport`, `passport-local`, `passport-google-oauth20` | Authentication strategies |
| `nodemailer` + `ejs` | Email delivery & templating |
| `cloudinary` | Media/resume/logo uploads |
| `multer` | File upload parsing (memory storage, 5MB limit) |
| `zod` | Request schema validation |
| `cors` + `cookie-parser` | CORS & cookie handling |
| `helmet` | HTTP security headers |
| `express-rate-limit` | Rate limiting |
| `node-cron` | Scheduled background jobs |
| `date-fns` | Date/time utilities |
| `http-status` | HTTP status code constants |
| `dotenv` | Environment configuration |
| `tsup` | Bundling for production/deployment |

**Development (`devDependencies`):**

- `typescript`, `tsx` (dev runner)
- `prisma` (schema/migrations CLI)
- Type definitions: `@types/node`, `@types/express`-related, `@types/multer`, `@types/nodemailer`, `@types/ejs`, `@types/passport*`, `@types/jsonwebtoken`, `@types/cors`, `@types/cookie-parser`

---

## 🚀 Getting Started

### 1️⃣ Clone the repository

```bash
git clone https://github.com/mdalamin0/Developer-Assessment-Coding-Platform.git
```

### 2️⃣ Navigate to the project directory

```bash
cd Developer-Assessment-Coding-Platform
```

### 3️⃣ Install dependencies

```bash
npm install
```

### 4️⃣ Configure Environment Variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

> **Note:** On Windows use `copy .env.example .env` instead.

Required environment variables (never commit real secrets):

```
# Server
PORT=5000
APP_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

# Database (PostgreSQL)
DATABASE_URL=

# JWT
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=

# Redis
REDIS_USER=
REDIS_PASSWORD=
REDIS_HOST=
REDIS_PORT=

# SMTP (Gmail) for emails
SMTP_USER=
SMTP_PASSWORD=
EMAIL_SENDER=

# Cloudinary (file uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# bKash Payment Gateway
BKASH_BASE_URL=
BKASH_USERNAME=
BKASH_PASSWORD=
BKASH_APP_KEY=
BKASH_APP_SECRET=
BKASH_CALLBACK_URL=

# Assessment publish fee (BDT)
ASSESSMENT_PUBLISH_FEE=

# Tester Admin (seeded on startup)
TESTER_ADMIN_NAME=
TESTER_ADMIN_EMAIL=
TESTER_ADMIN_PASSWORD=
```

Then run the Prisma migration (this uses the `DATABASE_URL` and generates the Prisma client):

```bash
npx prisma migrate deploy
```

### 5️⃣ Run the development server

```bash
npm run dev
```

The server starts and performs these **startup routines** automatically:

- Connects to **PostgreSQL** (`prisma.$connect()`)
- Connects to **Redis**
- Verifies the **Nodemailer** (email) transport
- **Seeds a tester Admin** account (from env vars)
- Registers the **cron jobs** for assessment lifecycle and auto-submitting expired attempts

---

## 🔌 API Documentation

The repository ships with a complete **Postman collection** at `postman/collection.json` — **Developer Assessment & Coding Platform API**. It covers every module:

- Server Health
- Auth (register, verify-email, login, Google OAuth, logout, forgot/reset password)
- Users & Profile
- Candidates
- Recruiters (profile, dashboard-stats, assessment-statistics)
- Admin (users, audit logs)
- Assessments (CRUD, publish, assessment-problems)
- Problems (CRUD)
- Invitations
- Attempts (start, questions, submit answer, submit)
- Answers (pending, evaluate)
- Results
- Payments (bKash)

**Local API base URL:** `http://localhost:5000/api/v1`

**Authentication:** Only public endpoints are the root health check, auth register / verify / login, Google OAuth, payment callback, and forgot/reset password. All other endpoints require `Authorization: Bearer <token>` (the token is also accepted as an httpOnly `accessToken` cookie).

### Core Module Endpoints (summary)

| Module | Base Path |
| --- | --- |
| Auth | `/api/v1/auth` |
| Users | `/api/v1/users` |
| Candidates | `/api/v1/candidates` |
| Recruiters | `/api/v1/recruiters` |
| Admin | `/api/v1/admin` |
| Assessments | `/api/v1/assessments` |
| Problems | `/api/v1/problems` |
| Invitations | `/api/v1/invitations` |
| Attempts | `/api/v1/attempts` |
| Answers | `/api/v1/answers` |
| Results | `/api/v1/results` |
| Payments | `/api/v1/payment` |

Install Postman, import `postman/collection.json`, configure the environment variables (`baseUrl`, `recruiterToken`, `candidateToken`, `adminToken`), and you're ready to test the full API.

---

## 👨‍💻 Author

**Al-amin**

- 📧 Email: [muhammadalamin809@gmail.com](mailto:muhammadalamin809@gmail.com)
- 🔗 GitHub: [github.com/mdalamin0](https://github.com/mdalamin0)

---

## 🛟 Support

If you find a bug or have a feature request, please open an issue on the [GitHub repository](https://github.com/mdalamin0/Developer-Assessment-Coding-Platform/issues). For any further assistance, feel free to reach out to the author via email.

> **Star ⭐ the repository** if you find this project useful, and happy coding!
