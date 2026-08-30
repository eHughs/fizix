# Trader Analytics

Dark-mode Next.js App Router trading journal and analytics dashboard backed by Supabase.

## Features

- Trade logger with Long/Short, entry/exit, P&L, strategy, optional realized R:R, and multi-select leak tags.
- Leak tracker that splits each losing trade's loss evenly across selected leak tags to prevent double-counting.
- Playbook table grouped by strategy with trade count, win rate, average R:R, and net P&L.
- Live in-page refresh after a trade is saved.
- Tailwind CSS dark UI using slate, emerald, and rose accents.
- Static Next.js export for a simple Cloudflare deployment.

## Supabase connection

`lib/supabase.ts` contains the connected project's public Supabase URL and **publishable** browser key as a fallback. This prevents Cloudflare static builds from shipping a disconnected dashboard when build-time environment variables are missing.

You can still override the defaults for another deployment or Supabase project with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Supabase publishable keys are designed to be exposed in browser applications. Never expose a secret key or legacy service-role key in client code.

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

## Cloudflare

This app uses `output: "export"` and the committed `wrangler.jsonc` deploys the generated `out/` directory directly as static assets.

Use:

- Deploy command: `npx wrangler deploy`
- Static output directory: `out`
- Node.js: 20.9+
- `NEXT_PUBLIC_SUPABASE_*` variables are optional overrides, not required for the connected default project

## Reliability checks

The repository includes a GitHub Actions workflow at `.github/workflows/ci.yml` that uses the committed lockfile with `npm ci`, runs strict TypeScript checking, performs a production Next.js build, confirms the Supabase fallback is compiled into the static browser bundle, and performs a Wrangler deployment dry run on every push and pull request.

Trade logging uses the `public.log_trade` database function so the trade and all selected leak tags are committed atomically. If any leak insert fails, the trade insert rolls back as well. Loss allocation also preserves cents exactly; for example, a $100 loss split across three leak tags is stored as $33.33, $33.33, and $33.34 rather than losing a cent.
