import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { TradeListItem } from "@/lib/services/trade-service";
import { formatCurrency } from "@/lib/format";

export default function TradeTableRow({ trade }: { trade: TradeListItem }) {
  const pnlClass = trade.net_pnl > 0 ? "text-emerald-400" : trade.net_pnl < 0 ? "text-rose-400" : "text-slate-300";
  const outcomeClass = trade.outcome === "Win"
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
    : trade.outcome === "Loss"
      ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
      : "border-slate-700 bg-slate-800/70 text-slate-400";

  return (
    <tr className="group border-b border-slate-800/70 transition-colors last:border-0 hover:bg-slate-900/55">
      <td className="px-5 py-4">
        <Link href={`/trades/${trade.id}`} className="inline-flex items-center gap-2 font-bold tracking-wide text-slate-100 group-hover:text-white">
          {trade.symbol}
          <ArrowUpRight size={14} className="text-slate-700 transition group-hover:text-emerald-400" />
        </Link>
      </td>
      <td className="px-5 py-4">
        <span className={`text-sm font-semibold ${trade.direction === "Long" ? "text-emerald-400" : "text-rose-400"}`}>{trade.direction}</span>
      </td>
      <td className="px-5 py-4 text-sm text-slate-400">{trade.strategy_tag}</td>
      <td className={`px-5 py-4 text-right text-sm font-bold tabular-nums ${pnlClass}`}>{formatCurrency(trade.net_pnl)}</td>
      <td className="px-5 py-4 text-right text-sm tabular-nums text-slate-400">
        {trade.r_multiple ?? trade.risk_reward ? `${Number(trade.r_multiple ?? trade.risk_reward).toFixed(2)}R` : "—"}
      </td>
      <td className="px-5 py-4">
        <span className={`inline-flex rounded-lg border px-2 py-1 text-[11px] font-bold ${outcomeClass}`}>{trade.outcome ?? "—"}</span>
      </td>
      <td className="px-5 py-4 text-right text-sm tabular-nums text-slate-500">{trade.trade_date ?? trade.created_at.slice(0, 10)}</td>
    </tr>
  );
}
