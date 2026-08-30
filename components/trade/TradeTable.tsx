import { Inbox } from "lucide-react";
import TradeTableRow from "@/components/trade/TradeTableRow";
import type { TradeListItem } from "@/lib/services/trade-service";

interface TradeTableProps {
  rows: TradeListItem[];
  loading: boolean;
}

export default function TradeTable({ rows, loading }: TradeTableProps) {
  if (loading) {
    return (
      <div className="space-y-2 p-5" aria-label="Loading trades">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-14 animate-pulse rounded-xl bg-slate-900/80" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="grid min-h-72 place-items-center px-6 py-12 text-center">
        <div className="max-w-sm">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-500">
            <Inbox size={20} />
          </div>
          <h2 className="text-sm font-semibold text-slate-200">No trades match this view</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Adjust your search or filters, or log a new trade to start building your journal.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/45 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">
            <th className="px-5 py-3.5">Symbol</th>
            <th className="px-5 py-3.5">Direction</th>
            <th className="px-5 py-3.5">Strategy</th>
            <th className="px-5 py-3.5 text-right">P&amp;L</th>
            <th className="px-5 py-3.5 text-right">R</th>
            <th className="px-5 py-3.5">Outcome</th>
            <th className="px-5 py-3.5 text-right">Date</th>
          </tr>
        </thead>
        <tbody>{rows.map((trade) => <TradeTableRow key={trade.id} trade={trade} />)}</tbody>
      </table>
    </div>
  );
}
