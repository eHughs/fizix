import Link from "next/link";
import { ArrowRight, Search, SlidersHorizontal, Table2 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";

export default function TradesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Trade journal"
        title="Trades"
        description="Your execution history lives here. The full searchable, filterable, paginated journal is implemented in Milestone 3."
        action={
          <Link
            href="/trades/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-emerald-950 transition hover:bg-emerald-400"
          >
            Log a trade
            <ArrowRight size={16} />
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Table2, title: "Complete journal", text: "Symbol, direction, strategy, P&L, R, outcome, and date in one focused table." },
          { icon: Search, title: "Fast search", text: "Find executions by symbol, setup, outcome, or date without digging through notes." },
          { icon: SlidersHorizontal, title: "Decision filters", text: "Direction, strategy, outcome, session, and date filters will drive the journal and exports." },
        ].map(({ icon: Icon, title, text }) => (
          <article key={title} className="rounded-2xl border border-slate-800 bg-slate-950/65 p-5 shadow-lg shadow-black/10">
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400">
              <Icon size={18} />
            </div>
            <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
