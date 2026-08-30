import { RotateCcw } from "lucide-react";
import TradeExportButton from "@/components/trade/TradeExportButton";
import TradeFilters from "@/components/trade/TradeFilters";
import TradeSearch from "@/components/trade/TradeSearch";
import TradeSort from "@/components/trade/TradeSort";
import type { TradeFilters as Filters, TradeSort as Sort } from "@/lib/services/trade-service";

interface TradeToolbarProps {
  filters: Filters;
  sort: Sort;
  strategies: string[];
  onFiltersChange: (filters: Filters) => void;
  onSortChange: (sort: Sort) => void;
  onReset: () => void;
}

export default function TradeToolbar({
  filters,
  sort,
  strategies,
  onFiltersChange,
  onSortChange,
  onReset,
}: TradeToolbarProps) {
  return (
    <div className="space-y-4 border-b border-slate-800 p-4 sm:p-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <TradeSearch
          value={filters.search}
          onChange={(search) => onFiltersChange({ ...filters, search })}
        />
        <div className="flex flex-wrap items-center gap-2">
          <TradeSort sort={sort} onChange={onSortChange} />
          <TradeExportButton filters={filters} sort={sort} />
          <button
            type="button"
            onClick={onReset}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 bg-slate-900/75 text-slate-500 transition hover:border-slate-700 hover:text-slate-200"
            aria-label="Reset trade filters"
            title="Reset filters"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
      <TradeFilters filters={filters} strategies={strategies} onChange={onFiltersChange} />
    </div>
  );
}
