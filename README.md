# FundingPips Admin

Separate admin portal for the [FundingPips](https://fundingpips-xi.vercel.app/) marketing + trader site. Shares the same Neon database; lives in its own repo and Vercel project.

## Features

- Admin login (role `admin` / `ADMIN_EMAIL`)
- Dashboard: user count, challenges, total spend, recent signups
- Users: list, block/unblock, set role
- Challenges: list, update status (`active` / `completed` / `cancelled`)

## Setup

```bash
cp .env.example .env.local
# fill DATABASE_URL, SESSION_SECRET, ADMIN_EMAIL
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`ADMIN_EMAIL` must match an existing user in the shared Neon `users` table (register first on the main site if needed).

## Stack

- Next.js App Router + TypeScript
- Neon Postgres (`@neondatabase/serverless`)
- Session cookie `fp_session` (same table as main site)
