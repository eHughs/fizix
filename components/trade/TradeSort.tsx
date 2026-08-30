import { ArrowDownUp } from "lucide-react";
import type { TradeSort as Sort } from "@/lib/services/trade-service";

interface TradeSortProps {
  sort: Sort;
  onChange: (sort: Sort) => void;
}

export default function TradeSort({ sort, onChange }: TradeSortProps) {
  return (
    <div className="flex items-center gap-2">
      <ArrowDownUp size={16} className="text-slate-600" aria-hidden="true" />
      <select
        value={`${sort.field}:${sort.direction}`}
        onChange={(event) => {
          const [field, direction] = event.target.value.split(":") as [Sort["field"], Sort["direction"]];
          onChange({ field, direction });
        }}
        aria-label="Sort trades"
        className="h-10 rounded-xl border border-slate-800 bg-slate-900/75 px-3 text-sm text-slate-300 outline-none transition focus:border-emerald-500/50"
      >
        <option value="trade_date:desc">Newest trade date</option>
        <option value="trade_date:asc">Oldest trade date</option>
        <option value="net_pnl:desc">Highest P&amp;L</option>
        <option value="net_pnl:asc">Lowest P&amp;L</option>
        <option value="symbol:asc">Symbol A–Z</option>
        <option value="symbol:desc">Symbol Z–A</option>
        <option value="created_at:desc">Recently logged</option>
      </select>
    </div>
  );
}
