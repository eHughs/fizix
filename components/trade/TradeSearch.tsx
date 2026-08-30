import { Search, X } from "lucide-react";

interface TradeSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function TradeSearch({ value, onChange }: TradeSearchProps) {
  return (
    <label className="relative block min-w-0 flex-1">
      <span className="sr-only">Search trades</span>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={17} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search symbol or strategy…"
        className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900/75 pl-10 pr-10 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500/50"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-800 hover:text-slate-300"
        >
          <X size={15} />
        </button>
      ) : null}
    </label>
  );
}
