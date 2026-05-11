# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Next.js)
npm run build        # Production build
npm run lint         # ESLint
npx prisma studio   # Visual DB editor at localhost:5555
npx prisma generate # Regenerate Prisma client after schema changes
npx prisma migrate dev --name <name>  # Create new migration
docker compose up -d # Start local PostgreSQL
```

## Architecture

**finplan.ai** is a personal finance management app built with Next.js 15 (App Router), Prisma 5, Clerk auth, and PostgreSQL.

### Key Structure

- `app/_lib/prisma.ts` — Singleton PrismaClient export (`db`)
- `app/_lib/get-effective-user-id.ts` — Returns effective userId (supports account sharing)
- `app/_actions/` — Server Actions (e.g., `upsert-transaction`, `pay-credit-card-bill`)
- `app/_data/` — Data fetching functions (e.g., `get-credit-card-summary`, `get-credit-card-bills`)
- `app/_components/` — Shared components (UI primitives in `ui/`, feature components alongside)
- `app/_constants/` — Label mappings and select options for enums
- `app/(home)/` — Dashboard (logged in) or Landing Page (visitors)
- `app/transactions/` — Transactions page with `_columns/` and `_components/`
- `app/credit-cards/` — Credit cards, bills, installments management
- `app/budget/` — Monthly budget by category
- `app/categories/` — Custom categories management
- `app/subscription/` — Plans page (free vs premium)
- `middleware.ts` — Clerk auth middleware
- `prisma/schema.prisma` — Database models and enums

### Database Models

- **Transaction** — Income, expenses, investments with categories, payment methods, installments, credit card relation
- **CreditCard** — User credit cards with limit, closing day, due day, brand
- **CreditCardBill** — Monthly bills per card with status (OPEN/CLOSED/PAID/OVERDUE), auto-computed from dates
- **Budget** — Monthly budget limits per category
- **CustomCategory** — User-defined categories
- **AccountShare / AccountShareInvite** — Account sharing between users

### Key Features

- **Landing Page** — Route `/` shows landing page for unauthenticated visitors, dashboard for logged users
- **Credit Card Bills** — Auto-created per card/month, status transitions: OPEN → CLOSED → PAID/OVERDUE based on closing/due dates. No duplicate transactions on bill payment.
- **Installments** — Up to 48x, creates N transactions with divided amounts spread monthly
- **AI Reports** — OpenAI-powered financial analysis with transactions, budgets, credit cards, bills data. Structured prompt with scoring.
- **Account Sharing** — Share financial data with a partner via invite system
- **WhatsApp Float Button** — Floating contact button on landing and subscription pages
- **PWA** — Installable as mobile app
- **OG Image** — 1200x630 dashboard preview for link sharing

### Patterns

- **Server Components by default** — pages fetch data directly with `db`
- **Decimal serialization** — Prisma returns `Decimal` objects. Convert to `number` before passing to Client Components
- **Server Actions** — Validated with Zod schemas, authenticated via `getEffectiveUserId()`, call `revalidatePath` after mutations
- **UI components** — Based on shadcn/ui (Radix + CVA + Tailwind). Dark theme only
- **Path alias** — `@/*` maps to project root

### Database

- Local dev uses Docker PostgreSQL (container: `finance-ai-database`, port 5432)
- Production: Neon PostgreSQL
- Connection string in `.env` as `DATABASE_URL`
- Do NOT upgrade to Prisma 7 — Studio has breaking bugs with the adapter-based API

### Auth

- Clerk handles all authentication
- `userId` is obtained via `getEffectiveUserId()` which supports account sharing
- Environment vars: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`

### Pricing

- **Free**: 15 transactions/month, dashboard, credit cards, budgets
- **Premium (R$14,99/mês)**: Unlimited transactions, AI reports, account sharing, custom categories
