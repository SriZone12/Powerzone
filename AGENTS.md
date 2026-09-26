<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repo facts

- Single **Next.js 16.3.5** App Router app (not a monorepo); package manager is **npm** (`package-lock.json` — do not use yarn/pnpm/bun). Build runs Turbopack by default.
- `CLAUDE.md` is just `@AGENTS.md`; this file is the single source of agent instructions.
- **The repo path contains a space** (`Desktop/WEB APP DEV/`) — quote paths in shell commands and `workdir`.
- `next.config.ts` is empty (no `typedRoutes`, no `turbopack.root`, no image/redirect config). Don't assume config exists.

## Commands

```bash
npm run dev     # dev server, http://localhost:3000 (also regenerates the managed block above)
npm run build   # production build — also typechecks via Next
npm run lint    # eslint (flat config in eslint.config.mjs)
npx tsc --noEmit  # typecheck; there is no npm script for this
```

Verify in this order before handing work back: `npm run lint` → `npx tsc --noEmit` → `npm run build`. There is **no test framework**; do not invent one or claim tests pass.

- **`next-env.d.ts` and `.next/` are gitignored.** On a fresh clone, `npx tsc --noEmit` fails because the Next-generated globals (`LayoutProps`, `PageProps`) live in `.next/types/` and are pulled in via `next-env.d.ts`. Run `npm run dev` or `npm run build` once before trusting a typecheck.
- `npm run build` prints a harmless warning that a stray `/home/khatri/package-lock.json` is outside the git repo and ignored. It is not caused by this project's files.
- No pre-commit hooks. CI (`.github/workflows/ci.yml`, Node 22) runs `lint` → `tsc --noEmit` → `build` on push to `main` and on PRs.

## Architecture

- **`@/*` maps to the repo root**, not to `app/` (`tsconfig.json` → `"@/*": ["./*"]`). Import `@/components/Navbar`, `@/lib/supabase`; `@/app/...` is wrong.
- `components/` and `lib/` sit at the **repo root**, not inside `app/`.
- Every page is a **client component** (`"use client"`) that fetches from Supabase in a `useEffect` with an explicit `cancelled` flag and separate `loading` / `error` state. There are **no server components, no server actions, no React Query**. Follow this pattern; don't introduce a data layer.
- Routes:
  - `app/page.tsx` — client hero card; redirects to `/dashboard` if a session already exists, otherwise links to `/login`.
  - `app/login/page.tsx` + `components/LoginForm.tsx` — `signInWithPassword` → `/dashboard`. No signup flow; the admin user is created in the Supabase Dashboard.
  - `app/(app)/` route group — `layout.tsx` wraps children in `components/AuthGuard.tsx` (client; `supabase.auth.getSession()` + `onAuthStateChange` → `router.replace("/login")`) then `components/Navbar.tsx` (client; `usePathname`, exact match for `/dashboard`, `startsWith` for `/members/*`; Logout = `signOut()` → `/login`).
  - `app/(app)/dashboard/`, `app/(app)/members/`, `app/(app)/members/add/`, `app/(app)/attendance/`.
- **Auth is client-side only** — no `middleware.ts`, no server-side gate. Security comes entirely from Supabase **Row Level Security** (`authenticated`-only policies).

## Database

- **There are no SQL files, migrations, or schema definitions in this repo.** Tables, RLS policies, and the expiry function exist only in the live Supabase project. The only in-repo record of the shape is the TypeScript types and `insert()` calls:
  - `members`: `id, full_name, phone, email, membership_plan, membership_start, status, membership_end`
  - `attendance`: `id, member_id, date, check_in_time` — **unique on `(member_id, date)`** in the DB.
  - Before adding or changing a column, ask the user to run it in Supabase; do not invent a migration folder.
- `status` is constrained to `active` / `expired` (`STATUSES` in `app/(app)/members/page.tsx`); a bad value returns Postgres `23514`.
- `membership_plan` stores the **label**, not the id (e.g. `"3-months"`, from `MEMBERSHIP_PLANS` in `lib/plans.ts`).
- `membership_end` is derived by `addMonths()` in `app/(app)/members/add/page.tsx:368`, which clamps to the last day of the target month.
- Expiry runs **twice**, and the names don't match: the dashboard calls `supabase.rpc("expire_members")` on every load (`app/(app)/dashboard/page.tsx:37`) and **deliberately swallows the error** so the page still works if the function was never created; the README also describes a pg_cron job named `expire-memberships`. Don't "fix" one into the other without asking.

## Conventions that differ from defaults

- **Always surface Supabase errors through `friendlyError(error.code)`** (`lib/errors.ts`), which maps Postgres codes (`42501`, `23505`, `23503`, `23514`, `42P01`) to plain English. Never show a raw `error.message` to the user or `console.log` an error. Two places intentionally bypass it for a better message: the duplicate-check-in path in `app/(app)/attendance/page.tsx` (`23505` → "already marked attendance today") and the swallowed `expire_members` RPC.
- **Dates are local-time, timestamps are UTC.** `formatLocalDate()` builds `YYYY-MM-DD` from `getFullYear/getMonth/getDate`; `parseLocalDate()` parses with `new Date(\`${value}T00:00:00\`)`. Check-ins store `date: formatLocalDate(now)` but `check_in_time: new Date().toISOString()` (UTC) — these can disagree by a day in non-UTC timezones. **Never** use `toISOString().slice(0, 10)` as a date key.
- Those date helpers are **copy-pasted per page, not shared in `lib/`**: `formatLocalDate` exists in `app/(app)/attendance/page.tsx`, `app/(app)/dashboard/page.tsx`, and `app/(app)/members/add/page.tsx`. Same for the `inputClass` string constant. When adding a helper, decide deliberately whether to keep copying or promote it to `lib/` — don't create a duplicate by accident.
- Nested selects like `members(full_name)` come back as an object *or* a one-element array depending on the relationship; normalize with `Array.isArray(r.members) ? r.members[0] : r.members`.
- Tailwind CSS **v4**, CSS-first: there is no `tailwind.config.*`. Theme vars and custom keyframes live in `app/globals.css`; PostCSS wiring is in `postcss.config.mjs`.
- Custom animations are keyframes in `app/globals.css` (currently `zoom-in`, `fade-up`) applied via arbitrary values, e.g. `animate-[zoom-in_0.7s_ease-out]`. Add keyframes there — do **not** install an animation plugin.
- **Dark mode follows the OS** via `prefers-color-scheme` (globals.css media query + Tailwind v4's default `dark:` variant). There is no theme toggle and no `.dark` class — don't add one without asking, and keep `dark:` variants on new UI.
- Reuse the established aesthetic rather than inventing a palette: `rounded-2xl`/`rounded-3xl` cards, translucent surfaces (`bg-white/80 backdrop-blur-xl`), primary buttons `bg-neutral-900 … dark:bg-white`, secondary as bordered `border-neutral-300`, layout shell `mx-auto max-w-7xl`.
- Fonts come from `next/font/google` (Geist / Geist Mono) in `app/layout.tsx`, exposed as `--font-geist-sans` / `--font-geist-mono`. Don't add a font loader.
- Next 16 generated types are preferred over hand-written props: the root layout uses `LayoutProps<"/">` rather than `{ children: React.ReactNode }`. Use `PageProps` / `LayoutProps` / `RouteContext` in new routes.

## Environment

- `lib/supabase.ts` builds the client from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. **Both are required** — the values are `!`-asserted but `createClient(undefined, …)` throws, so `next build` fails without them.
- `.env*` is gitignored; `.env.local` already exists locally and Next loads it automatically. CI supplies the same two names as **GitHub Actions variables** (`vars.*`, not secrets) — if CI's build step fails on missing env, that's a repo-settings issue, not a code change.
- Never commit real keys. The anon key is safe to expose only because RLS is enabled.
