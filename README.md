# Powerzone Fitness — Gym Management

Admin panel for a gym built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **Supabase**. Members, memberships, and daily attendance management for Powerzone Fitness.

## Features

- **Auth** — email/password login (Supabase Auth). Admin pages are guarded client-side by `components/AuthGuard`.
- **Dashboard** — total / active / expired member counts, today's attendance, recent members.
- **Members** — list with edit and delete (confirmation dialog), add-member form with plan-based end-date calculation.
- **Attendance** — check active members in once per day (DB-unique on `member_id, date`), today's check-in list.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Environment variables

Create `.env.local` (gitignored):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

From Supabase → Project Settings → API. The anon key is safe to expose publicly **only** because Row Level Security is enabled.

### Creating the admin account

The app has no signup flow. Create the user once in **Supabase Dashboard → Authentication → Users → Add user**.

## Database

Both `members` and `attendance` tables use **Row Level Security** with `authenticated`-only policies. `membership_end` auto-expires daily via a pg_cron job (`expire-memberships`).

## Scripts

```bash
npm run dev      # development server
npm run build    # production build (typechecks via Next)
npm run lint     # eslint (flat config)
npx tsc --noEmit # typecheck
```

## Deploy

Recommended: [Vercel](https://vercel.com). Set both env vars in the project settings (they are baked in at build time), then deploy from the `main` branch. CI runs `lint` → `typecheck` → `build` on push/PR.