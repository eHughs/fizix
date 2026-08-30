"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  fetchFilteredTradesForExport,
  type TradeFilters,
  type TradeListItem,
  type TradeSort,
} from "@/lib/services/trade-service";

interface TradeExportButtonProps {
  filters: TradeFilters;
  sort: TradeSort;
}

function csvEscape(value: string | number | null) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function buildCsv(rows: TradeListItem[]) {
  const headers = ["Symbol", "Direction", "Strategy", "Net P&L", "R", "Outcome", "Trade Date", "Trade Time", "Session"];
  const lines = rows.map((row) => [
    row.symbol,
    row.direction,
    row.strategy_tag,
    row.net_pnl,
    row.r_multiple ?? row.risk_reward,
    row.outcome,
    row.trade_date,
    row.trade_time,
    row.session,
  ].map(csvEscape).join(","));

  return [headers.map(csvEscape).join(","), ...lines].join("\n");
}

export default function TradeExportButton({ filters, sort }: TradeExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportCsv() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setExporting(true);
    setError(null);

    try {
      const rows = await fetchFilteredTradesForExport(supabase, filters, sort);
      const blob = new Blob([buildCsv(rows)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `trader-analytics-trades-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to export trades.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error ? <span className="hidden max-w-52 truncate text-xs text-rose-400 sm:block" title={error}>{error}</span> : null}
      <button
        type="button"
        onClick={exportCsv}
        disabled={exporting}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/75 px-3.5 text-sm font-semibold text-slate-300 transition hover:border-slate-700 hover:text-white disabled:opacity-60"
      >
        {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        Export CSV
      </button>
    </div>
  );
}
