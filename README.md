# Loyalty Reward System

A multi-tenant SaaS loyalty management platform for retail shops. Shop staff manage customers, track purchases, issue loyalty points, send SMS messages, and handle gift cards.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript (Vite) |
| Backend | Express + TypeScript (Node.js ≥ 18) |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 5 |
| SMS | text.lk API |

---

## Prerequisites

Make sure the following are installed on your machine before you start:

- [Node.js](https://nodejs.org/) **v18 or higher** (`node -v` to check)
- [npm](https://www.npmjs.com/) v9+ (comes with Node)
- [Git](https://git-scm.com/)
- A [Supabase](https://supabase.com/) account (free tier is fine for development)

---

## 1. Clone the Repository

```bash
git clone <repo-url>
cd Loyalty-reward-system
```

---

## 2. Backend Setup

### 2.1 Install dependencies

```bash
cd Backend
npm install
```

### 2.2 Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the values:

```env
# Server
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173

# Database — get these from your Supabase project → Settings → Database → Connection string
DATABASE_URL="postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# Auth — use any long random string (min 32 chars)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Encryption — must be EXACTLY 32 characters (AES-256)
ENCRYPTION_KEY=your-32-character-encryption-key!

# SMS — text.lk (leave as-is for local dev, configure per shop via admin panel)
SMS_API_URL=https://app.text.lk/api/v3/sms/send
```

> **Note:** `AWS_REGION` and `AWS_SECRET_NAME` are only required in production (EC2). Leave them out for local development.

**How to get Supabase connection strings:**
1. Go to [supabase.com](https://supabase.com) → your project
2. Navigate to **Settings → Database**
3. Under **Connection string**, select **URI** mode
4. Copy the **Transaction** string → `DATABASE_URL` (add `?pgbouncer=true` at the end)
5. Copy the **Direct** string → `DIRECT_URL`

### 2.3 Generate Prisma client

```bash
npm run prisma:generate
```

### 2.4 Run database migrations

```bash
npm run prisma:migrate
```

When prompted for a migration name, enter something descriptive like `init`.

> **Note:** This will create all tables in your Supabase database. Make sure your `DATABASE_URL` and `DIRECT_URL` are correct before running this.

### 2.5 (Optional) Seed the database

```bash
npm run prisma:seed
```

This populates the `plans` table with the four default plans (`basic`, `standard`, `pro`, `enterprise`) and their features/limits.

### 2.6 Start the backend server

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:3000`. All routes are prefixed with `/api/v1/`.

---

## 3. Frontend Setup

Open a **new terminal tab** from the project root.

### 3.1 Install dependencies

```bash
cd Frontend
npm install
```

### 3.2 Configure environment variables

Create a `.env.local` file in the `Frontend/` directory:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

### 3.3 Start the frontend dev server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 4. Running Both Together

You need two terminal windows running simultaneously:

| Terminal | Directory | Command |
|---|---|---|
| 1 | `Backend/` | `npm run dev` |
| 2 | `Frontend/` | `npm run dev` |

---

## 5. Project Structure

```
Loyalty-reward-system/
├── Backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   ├── migrations/         # Auto-generated migration files
│   │   └── seed.js             # Seed data (plans + features)
│   ├── src/
│   │   ├── config/             # DB, secrets, constants
│   │   ├── jobs/               # Cron jobs (expiry, trial, SMS)
│   │   ├── middleware/         # Auth, feature gates, error handling
│   │   ├── modules/            # Feature modules (auth, customers, etc.)
│   │   ├── services/           # Cache, encryption, SMS, entitlements
│   │   └── utils/              # Response helpers, logger, pagination
│   ├── .env.example            # Copy this to .env
│   └── server.js               # Entry point
└── Frontend/
    ├── src/
    │   └── ...                 # React components and pages
    └── index.html
```

---

## 6. Common Issues

**`prisma migrate dev` fails with "relation already exists"**
Your database already has some tables. Run `npx prisma migrate reset` to wipe and re-apply all migrations (development only — this deletes all data).

**`Invalid DATABASE_URL` error**
Make sure there are no extra spaces or missing quotes in your `.env`. The URL must be wrapped in double quotes.

**Port 3000 already in use**
Change `PORT=3001` in your `.env` and update `VITE_API_URL` in the frontend to match.

**Prisma client not found**
Run `npm run prisma:generate` in the `Backend/` directory. This must be re-run after any schema changes.

---

## 7. Environment Summary

| Environment | Frontend | Backend | Database |
|---|---|---|---|
| Local dev | `localhost:5173` | `localhost:3000` | Supabase free project |
| Staging | Vercel preview | Staging EC2 | Supabase staging |
| Production | Vercel (custom domain) | Production EC2 + PM2 | Supabase Pro |

---

## 8. Making Schema Changes

1. Edit `Backend/prisma/schema.prisma`
2. Run `npm run prisma:migrate` — enter a descriptive migration name
3. Run `npm run prisma:generate` to update the Prisma client
4. Commit both the updated `schema.prisma` and the new file in `prisma/migrations/`

> **Never** manually edit migration files. Always use `prisma migrate dev` to generate them.
