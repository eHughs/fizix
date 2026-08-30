import PerformanceCharts from "@/components/analytics/PerformanceCharts";
import DashboardOverview from "@/components/DashboardOverview";
import LeakTracker from "@/components/LeakTracker";
import PlaybookTable from "@/components/PlaybookTable";
import TradeLogger from "@/components/TradeLogger";

export default function DashboardPage() {
  return (
    <div>
      <section className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Performance overview
          </div>
          <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-50 sm:text-4xl">How are you performing?</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Review your execution, trading mistakes, and strategy performance from one focused workspace.
          </p>
        </div>
      </section>

      <DashboardOverview />

      <div className="mt-6">
        <PerformanceCharts />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <TradeLogger />
        <LeakTracker />
      </div>

      <div className="mt-6">
        <PlaybookTable />
      </div>
    </div>
  );
}
