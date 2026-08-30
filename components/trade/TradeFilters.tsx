import type { TradeFilters as Filters } from "@/lib/services/trade-service";

interface TradeFiltersProps {
  filters: Filters;
  strategies: string[];
  onChange: (filters: Filters) => void;
}

export default function TradeFilters({ filters, strategies, onChange }: TradeFiltersProps) {
  const fieldClass =
    "h-11 rounded-xl border border-slate-800 bg-slate-900/75 px-3 text-sm text-slate-200 outline-none transition focus:border-emerald-500/50";

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <label>
        <span className="sr-only">Direction</span>
        <select
          value={filters.direction}
          onChange={(event) => onChange({ ...filters, direction: event.target.value as Filters["direction"] })}
          className={`${fieldClass} w-full`}
        >
          <option value="all">All directions</option>
          <option value="Long">Long</option>
          <option value="Short">Short</option>
        </select>
      </label>

      <label>
        <span className="sr-only">Strategy</span>
        <select
          value={filters.strategy}
          onChange={(event) => onChange({ ...filters, strategy: event.target.value })}
          className={`${fieldClass} w-full`}
        >
          <option value="all">All strategies</option>
          {strategies.map((strategy) => <option key={strategy} value={strategy}>{strategy}</option>)}
        </select>
      </label>

      <label>
        <span className="sr-only">Outcome</span>
        <select
          value={filters.outcome}
          onChange={(event) => onChange({ ...filters, outcome: event.target.value as Filters["outcome"] })}
          className={`${fieldClass} w-full`}
        >
          <option value="all">All outcomes</option>
          <option value="Win">Win</option>
          <option value="Loss">Loss</option>
          <option value="Breakeven">Breakeven</option>
        </select>
      </label>

      <label>
        <span className="sr-only">Start date</span>
        <input
          type="date"
          value={filters.startDate}
          onChange={(event) => onChange({ ...filters, startDate: event.target.value })}
          className={`${fieldClass} w-full [color-scheme:dark]`}
          aria-label="Start date"
        />
      </label>

      <label>
        <span className="sr-only">End date</span>
        <input
          type="date"
          value={filters.endDate}
          onChange={(event) => onChange({ ...filters, endDate: event.target.value })}
          className={`${fieldClass} w-full [color-scheme:dark]`}
          aria-label="End date"
        />
      </label>
    </div>
  );
}
