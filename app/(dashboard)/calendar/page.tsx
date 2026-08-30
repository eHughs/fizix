import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";

export default function CalendarPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Daily performance"
        title="Trading Calendar"
        description="A monthly view will group your real trades by day so you can spot profitable stretches, rough periods, and consistency patterns."
      />

      <section className="rounded-2xl border border-slate-800 bg-slate-950/65 p-5 shadow-lg shadow-black/10 sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400">
              <CalendarDays size={18} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Monthly trading review</h2>
              <p className="mt-1 text-xs text-slate-500">Calendar calculations arrive in Milestone 8.</p>
            </div>
          </div>
          <div className="flex gap-2" aria-hidden="true">
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-slate-800 text-slate-600"><ChevronLeft size={16} /></span>
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-slate-800 text-slate-600"><ChevronRight size={16} /></span>
          </div>
        </div>

        <div className="grid min-h-64 place-items-center py-12 text-center">
          <div className="max-w-md">
            <p className="text-sm font-semibold text-slate-300">No fake calendar data is being shown.</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              When the calendar milestone is implemented, each day will be calculated from your Supabase trades and show daily P&L, trade count, and win/loss status.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
