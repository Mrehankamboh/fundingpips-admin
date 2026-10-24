# FundingPips Admin

Separate admin portal for the [FundingPips](https://fundingpips-xi.vercel.app/) marketing + trader site. Shares the same Neon database; lives in its own repo and Vercel project.

## Features

- Admin login (role `admin` / `ADMIN_EMAIL`)
- Dashboard: user count, challenges, total spend, recent signups
- Users: list, block/unblock, set role
- Challenges: list, update status (`active` / `completed` / `cancelled`)

## Setup (UI only — default)

```bash
cp .env.example .env.local   # NEXT_PUBLIC_UI_ONLY=1 already set
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → Sign in (any / prefilled) to browse Dashboard, Users, Challenges with mock data. No push/deploy required.

## Live Neon auth (later)

Set `NEXT_PUBLIC_UI_ONLY=0` / `UI_ONLY=0` and fill `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`.

## Stack

- Next.js App Router + TypeScript
- Neon Postgres (`@neondatabase/serverless`)
- Session cookie `fp_session` (same table as main site)
