# Trader Analytics

Dark-mode Next.js App Router trading journal and analytics dashboard backed by Supabase.

## Features

- Trade logger with Long/Short, entry/exit, P&L, strategy, optional realized R:R, and multi-select leak tags.
- Leak tracker that splits each losing trade's loss evenly across selected leak tags to prevent double-counting.
- Playbook table grouped by strategy with trade count, win rate, average R:R, and net P&L.
- Live in-page refresh after a trade is saved.
- Tailwind CSS dark UI using slate, emerald, and rose accents.
- Static Next.js export for a simple Cloudflare Pages deployment.

## Environment variables

Create `.env.local` for local development or add these as Cloudflare build variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Use a Supabase **publishable** key in the browser. Never expose a secret/service-role key.

## Supabase schema

The SQL used by this project is in `supabase/trader_analytics.sql`.

The connected Supabase project used while building this app has already been configured with the `trades` and `trade_leaks` tables and tested with the `anon` browser role.

### Current access model

This requested dashboard has no sign-in screen, so its RLS policies allow `anon` and `authenticated` users to `SELECT` and `INSERT` trading rows. Update/delete are not granted. That makes the requested no-login client app work, but it also means a public deployment is not private. Add Supabase Auth plus owner-based RLS before storing sensitive production trading data.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` or `http://localhost:3000/dashboard`.

## Verification

```bash
npm run typecheck
npm run build
```

## Cloudflare Pages

This app uses `output: "export"`, so the Cloudflare deployment is static and does not require OpenNext/vinext.

Use:

- Framework preset: **Next.js (Static HTML Export)** if available, otherwise no preset.
- Build command: `npm run build`
- Build output directory: `out`
- Node.js: 20.9+ (Cloudflare's current Node 24 build image is fine)
- Build variables: both `NEXT_PUBLIC_SUPABASE_*` values listed above

Because `NEXT_PUBLIC_*` variables are compiled into the browser bundle, set them in Cloudflare **before** the production build.

## Reliability checks

The repository includes a GitHub Actions workflow at `.github/workflows/ci.yml` that installs the pinned dependencies, runs strict TypeScript checking, and performs a production Next.js build on every push and pull request.

Trade logging uses the `public.log_trade` database function so the trade and all selected leak tags are committed atomically. If any leak insert fails, the trade insert rolls back as well. Loss allocation also preserves cents exactly; for example, a $100 loss split across three leak tags is stored as $33.33, $33.33, and $33.34 rather than losing a cent.
