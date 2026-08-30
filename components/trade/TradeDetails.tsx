"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, ImageIcon, Loader2, Pencil, Target } from "lucide-react";
import { useEffect, useState } from "react";
import DeleteTradeDialog from "@/components/trade/DeleteTradeDialog";
import { createTradeScreenshotUrl, fetchTradeDetails, type TradeDetailsRecord } from "@/lib/services/trade-details-service";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";

export default function TradeDetails({ tradeId }: { tradeId: string }) {
  const [trade, setTrade] = useState<TradeDetailsRecord | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    void (async () => {
      try {
        const nextTrade = await fetchTradeDetails(supabase, tradeId);
        setTrade(nextTrade);
        if (nextTrade.screenshot_url) {
          setScreenshotUrl(await createTradeScreenshotUrl(supabase, nextTrade.screenshot_url));
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to load trade.");
      } finally {
        setLoading(false);
      }
    })();
  }, [tradeId]);

  if (loading) return <div className="grid min-h-96 place-items-center"><Loader2 className="animate-spin text-emerald-400" /></div>;
  if (error || !trade) return <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-5 text-sm text-rose-300">{error ?? "Trade not found."}</div>;

  const pnlClass = trade.net_pnl > 0 ? "text-emerald-400" : trade.net_pnl < 0 ? "text-rose-400" : "text-slate-300";
  const metric = (label: string, value: string) => <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">{label}</p><p className="mt-2 text-sm font-semibold text-slate-200">{value}</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/trades" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-200"><ArrowLeft size={15} /> Back to trades</Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-[-0.04em] text-white">{trade.symbol}</h1>
            <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${trade.direction === "Long" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-rose-500/20 bg-rose-500/10 text-rose-400"}`}>{trade.direction}</span>
            <span className="rounded-lg border border-slate-700 bg-slate-800/70 px-2.5 py-1 text-xs font-bold text-slate-400">{trade.outcome ?? "Unrated"}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><CalendarDays size={14} /> {trade.trade_date ?? trade.created_at.slice(0,10)}</span><span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> {(trade.trade_time ?? "—").slice(0,5)}</span><span>{trade.session || "No session tagged"}</span></div>
        </div>

        <div className="flex flex-wrap items-start gap-2">
          <Link href={`/trades/${trade.id}/edit`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3.5 text-sm font-semibold text-slate-300 transition hover:text-white"><Pencil size={16} /> Edit</Link>
          <DeleteTradeDialog tradeId={trade.id} screenshotPath={trade.screenshot_url} />
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/65 p-5"><p className="text-xs font-semibold text-slate-500">Net P&amp;L</p><p className={`mt-2 text-2xl font-bold tabular-nums ${pnlClass}`}>{formatCurrency(trade.net_pnl)}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/65 p-5"><p className="text-xs font-semibold text-slate-500">R multiple</p><p className="mt-2 text-2xl font-bold tabular-nums text-slate-100">{trade.r_multiple == null ? "—" : `${trade.r_multiple.toFixed(2)}R`}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/65 p-5"><p className="text-xs font-semibold text-slate-500">Strategy</p><p className="mt-2 text-lg font-bold text-slate-100">{trade.strategy_tag}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/65 p-5"><p className="text-xs font-semibold text-slate-500">Mistakes tagged</p><p className="mt-2 text-2xl font-bold text-slate-100">{trade.leak_names.length}</p></div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-950/65 p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-2"><Target size={17} className="text-emerald-400" /><h2 className="text-sm font-semibold text-slate-100">Execution details</h2></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {metric("Entry price", String(trade.entry_price))}
            {metric("Exit price", String(trade.exit_price))}
            {metric("Position size", trade.position_size == null ? "—" : String(trade.position_size))}
            {metric("Stop loss", trade.stop_loss == null ? "—" : String(trade.stop_loss))}
            {metric("Take profit", trade.take_profit == null ? "—" : String(trade.take_profit))}
            {metric("Last updated", new Date(trade.updated_at).toLocaleString())}
          </div>

          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/35 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">Review notes</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-400">{trade.notes || "No review notes were recorded for this trade."}</p>
          </div>

          <div className="mt-5">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">Leak / mistake tags</p>
            <div className="flex flex-wrap gap-2">{trade.leak_names.length ? trade.leak_names.map((name) => <span key={name} className="rounded-lg border border-rose-500/20 bg-rose-500/[0.08] px-2.5 py-1.5 text-xs font-semibold text-rose-300">{name}</span>) : <span className="text-sm text-slate-600">No mistakes tagged.</span>}</div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/65">
          <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-4"><ImageIcon size={16} className="text-slate-500" /><h2 className="text-sm font-semibold text-slate-200">Trade screenshot</h2></div>
          {screenshotUrl ? <img src={screenshotUrl} alt={`${trade.symbol} trade screenshot`} className="max-h-[520px] w-full object-contain bg-black/20" /> : <div className="grid min-h-64 place-items-center p-6 text-center"><div><ImageIcon className="mx-auto mb-3 text-slate-700" size={28} /><p className="text-sm text-slate-500">No screenshot attached.</p></div></div>}
        </section>
      </div>
    </div>
  );
}
