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

The connected Supabase project used while building this app has already been configured with the `trades` and `trade_leaks` tables and tested with the browser role used by the application.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` or `http://localhost:3000/dashboard`.

## Verification

```bash
npm run verify
```

This runs strict TypeScript checking, creates a fresh static export, verifies that no Vinext/Vite generated Wrangler redirect exists, and performs a Wrangler dry run.

## Cloudflare

Trader Analytics is deployed as a **pure static Next.js export**. It does not use a Vinext/Vite Worker entry point.

The repository includes `scripts/prepare-cloudflare-deploy.mjs`, which removes stale `.wrangler/` and `out/` output, rebuilds the site, and then Wrangler deploys only the fresh `out/` directory. This prevents Cloudflare's build cache from restoring an old generated Vinext configuration such as `vinext/server/app-router-entry`.

Recommended Cloudflare Workers Builds settings:

- Build command: leave blank
- Deploy command: `npm run deploy`
- Root directory: repository root
- Node.js: 20.9 or newer
- Static output directory: `out`

`npm run deploy` is intentionally self-contained: it cleans stale Cloudflare framework output, runs the production Next.js build, and then runs Wrangler. Do not change the Cloudflare deploy command back to bare `npx wrangler deploy` unless a separate Cloudflare Build command is also configured.

If this project was previously deployed with Vinext/Vite, clearing the Cloudflare build cache once is recommended. Future deploys are protected by the cleanup script even if cache restoration is enabled.

## Reliability checks

The repository includes a GitHub Actions workflow at `.github/workflows/ci.yml` that uses the committed lockfile with `npm ci`, runs strict TypeScript checking, performs the same clean production export used for Cloudflare, verifies `out/index.html`, rejects any generated `.wrangler/deploy/config.json`, and performs a Wrangler deployment dry run on every push and pull request.

Trade logging uses the `public.log_trade` database function so the trade and all selected leak tags are committed atomically. If any leak insert fails, the trade insert rolls back as well. Loss allocation also preserves cents exactly; for example, a $100 loss split across three leak tags is stored as $33.33, $33.33, and $33.34 rather than losing a cent.
