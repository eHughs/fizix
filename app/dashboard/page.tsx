import DashboardOverview from "@/components/DashboardOverview";
import LeakTracker from "@/components/LeakTracker";
import PlaybookTable from "@/components/PlaybookTable";
import TradeLogger from "@/components/TradeLogger";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-emerald-500/[0.055] blur-3xl" />
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-sky-500/[0.045] blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-10">
        <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 shadow-sm shadow-emerald-950/20">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Live performance journal
            </div>
            <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-50 sm:text-4xl">Trader Analytics</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Log every execution, expose costly habits, and identify the setups that actually earn more size.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/65 px-3.5 py-2.5 text-xs font-medium text-slate-400 shadow-lg shadow-black/10">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Supabase connected analytics
          </div>
        </header>

        <DashboardOverview />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.06fr_0.94fr]">
          <TradeLogger />
          <LeakTracker />
        </div>

        <div className="mt-6">
          <PlaybookTable />
        </div>

        <footer className="mt-8 flex flex-col gap-2 border-t border-slate-800/80 pt-5 text-xs leading-5 text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>Trader Analytics records journal data only. It does not place trades or provide financial advice.</span>
          <span className="text-slate-700">Cloudflare Pages · Next.js · Supabase</span>
        </footer>
      </div>
    </main>
  );
}
