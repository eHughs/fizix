import LeakTracker from "@/components/LeakTracker";
import PlaybookTable from "@/components/PlaybookTable";
import TradeLogger from "@/components/TradeLogger";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Performance journal
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">Trader Analytics</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Log every trade, quantify costly behavioral leaks, and find which setups actually deserve more size.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">
            <span className="font-semibold text-slate-200">Cloudflare-ready</span>
            <span className="mx-2 text-slate-700">•</span>
            Static Next.js + Supabase
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.06fr_0.94fr]">
          <TradeLogger />
          <LeakTracker />
        </div>

        <div className="mt-6">
          <PlaybookTable />
        </div>

        <footer className="mt-8 border-t border-slate-800 pt-5 text-xs leading-5 text-slate-600">
          Trader Analytics records journal data only. It does not place trades or provide financial advice.
        </footer>
      </div>
    </main>
  );
}
