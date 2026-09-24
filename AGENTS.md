<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repo facts

- Single Next.js 16 App Router app (not a monorepo); package manager is **npm** (`package-lock.json` — do not use yarn/pnpm/bun).
- Bundled Next.js docs: `node_modules/next/dist/docs/` (see managed block above). `CLAUDE.md` is just `@AGENTS.md`; this file is the single source of agent instructions.
- **Auth-gated admin area.** The homepage `app/page.tsx` is a client component: a branded hero card linking to `/login`. Admin routes live in the `app/(app)/` route group:
  - `app/(app)/layout.tsx` renders `components/AuthGuard.tsx` (client; checks `supabase.auth.getSession()` + `onAuthStateChange`) wrapping `components/Navbar.tsx` (a client component using `usePathname` from `next/navigation` for active-link highlighting, `startsWith` for `/members/*`).
  - `app/(app)/dashboard/`, `app/(app)/members/`, `app/(app)/members/add/`, `app/(app)/attendance/`.
  - `app/login/page.tsx` renders `components/LoginForm.tsx` (`signInWithPassword` → `/dashboard`); Navbar "Logout" calls `signOut()` → `/login`.
- **Authentication is client-side only.** All table queries rely on Supabase **Row Level Security** (authenticated-only policies) — there is no middleware or server-side gate. There is no signup flow; the admin user is created in the Supabase Dashboard.
- Shared components live at repo root `components/` and are imported via the `@/*` alias (e.g. `@/components/Navbar`). `@/*` maps to the repo root, so `@/app/...` is wrong — use `@/components/...`, `@/lib/...`.

## Supabase

- `@supabase/supabase-js` is installed; `lib/supabase.ts` exports a client built from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Build requires both env vars.** `createClient(undefined, …)` throws, so `next build` fails without them. `.env*` is gitignored — create `.env.local` locally (Next loads it automatically); CI passes the values from GitHub Actions `vars`. Do not commit real keys.

## Commands (no test or typecheck scripts exist)

```bash
npm run dev     # dev server, http://localhost:3000 (also regenerates the managed block above)
npm run build   # production build — typechecks via Next
npm run lint    # eslint (flat config in eslint.config.mjs)
npx tsc --noEmit  # typecheck; there is no npm script for this
```

Verification order before handing work back: `npm run lint` → `npx tsc --noEmit` → `npm run build`. There is **no test framework** configured; do not invent one or claim tests pass.

## Conventions that differ from defaults

- Tailwind CSS **v4** with CSS-first config: no `tailwind.config.*` file. Theme + custom keyframes live in `app/globals.css`; PostCSS wiring is in `postcss.config.mjs`.
- Custom CSS animations are keyframes defined in `app/globals.css` (currently `zoom-in`, `fade-up`) applied via Tailwind arbitrary values, e.g. `animate-[zoom-in_0.7s_ease-out]`. Add new keyframes there — do **not** install an animation plugin.
- Consistent aesthetic to reuse (not invent a new palette): `rounded-2xl`/`rounded-3xl` cards, translucent surfaces (`bg-white/80 backdrop-blur-xl`), primary buttons `bg-neutral-900 … dark:bg-white`, secondary as bordered `border-neutral-300`. Most pages support dark mode via `dark:` classes.
- ESLint 9 flat config (`.next/`, `out/`, `build/`, `next-env.d.ts` ignored); lint with `npm run lint`.
- CI exists at `.github/workflows/ci.yml` (lint → typecheck → build on push/PR). It needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set as **GitHub Actions variables** or the build step fails. No pre-commit hooks exist.