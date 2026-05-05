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
- `app/_actions/` — Server Actions (e.g., `upsert-transaction`)
- `app/_components/` — Shared components (UI primitives in `ui/`, feature components alongside)
- `app/_constants/` — Label mappings and select options for enums
- `app/transactions/` — Transactions page with `_columns/` (table column defs) and `_components/` (page-specific components)
- `middleware.ts` — Clerk auth middleware (protects all routes)
- `prisma/schema.prisma` — Single model: `Transaction` with enums

### Patterns

- **Server Components by default** — pages fetch data directly with `db`. Use `export const dynamic = "force-dynamic"` when data must not be cached.
- **Decimal serialization** — Prisma returns `Decimal` objects. Convert to `number` before passing to Client Components. Use `SerializedTransaction` type (defined in `_columns/index.tsx`).
- **Server Actions** — Validated with Zod schemas, authenticated via `auth()` from Clerk, and call `revalidatePath` after mutations.
- **UI components** — Based on shadcn/ui (Radix + CVA + Tailwind). Dark theme only.
- **Path alias** — `@/*` maps to project root.

### Database

- Local dev uses Docker PostgreSQL (container: `finance-ai-database`, port 5432)
- Connection string in `.env` as `DATABASE_URL`
- Do NOT upgrade to Prisma 7 — Studio has breaking bugs with the adapter-based API

### Auth

- Clerk handles all authentication
- `userId` is obtained via `auth()` in Server Actions/Components
- Environment vars: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
