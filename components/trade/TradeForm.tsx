"use client";

import { Camera, Loader2, Save, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  fetchTradeDetails,
  fetchTradeFormOptions,
  saveTrade,
  type LeakOption,
  type StrategyOption,
} from "@/lib/services/trade-details-service";

interface TradeFormProps {
  tradeId?: string;
}

interface FormState {
  symbol: string;
  direction: "Long" | "Short";
  entryPrice: string;
  exitPrice: string;
  positionSize: string;
  stopLoss: string;
  takeProfit: string;
  netPnl: string;
  strategyId: string;
  outcome: "Win" | "Loss" | "Breakeven";
  tradeDate: string;
  tradeTime: string;
  session: string;
  notes: string;
  screenshotUrl: string;
  leakIds: string[];
}

function todayLocal() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function timeLocal() {
  return new Date().toTimeString().slice(0, 5);
}

const initialForm = (): FormState => ({
  symbol: "",
  direction: "Long",
  entryPrice: "",
  exitPrice: "",
  positionSize: "",
  stopLoss: "",
  takeProfit: "",
  netPnl: "",
  strategyId: "",
  outcome: "Breakeven",
  tradeDate: todayLocal(),
  tradeTime: timeLocal(),
  session: "",
  notes: "",
  screenshotUrl: "",
  leakIds: [],
});

function optionalNumber(value: string) {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export default function TradeForm({ tradeId }: TradeFormProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [strategies, setStrategies] = useState<StrategyOption[]>([]);
  const [leaks, setLeaks] = useState<LeakOption[]>([]);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatedR = useMemo(() => {
    const entry = Number(form.entryPrice);
    const exit = Number(form.exitPrice);
    const stop = Number(form.stopLoss);
    if (!Number.isFinite(entry) || !Number.isFinite(exit) || !Number.isFinite(stop) || entry <= 0 || stop <= 0) return null;

    const risk = form.direction === "Long" ? entry - stop : stop - entry;
    const reward = form.direction === "Long" ? exit - entry : entry - exit;
    if (risk <= 0) return null;
    return reward / risk;
  }, [form.direction, form.entryPrice, form.exitPrice, form.stopLoss]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        const options = await fetchTradeFormOptions(supabase);
        setStrategies(options.strategies);
        setLeaks(options.leaks);

        if (tradeId) {
          const trade = await fetchTradeDetails(supabase, tradeId);
          setForm({
            symbol: trade.symbol,
            direction: trade.direction,
            entryPrice: String(trade.entry_price),
            exitPrice: String(trade.exit_price),
            positionSize: trade.position_size == null ? "" : String(trade.position_size),
            stopLoss: trade.stop_loss == null ? "" : String(trade.stop_loss),
            takeProfit: trade.take_profit == null ? "" : String(trade.take_profit),
            netPnl: String(trade.net_pnl),
            strategyId: trade.strategy_id ?? options.strategies.find((item) => item.name === trade.strategy_tag)?.id ?? "",
            outcome: trade.outcome ?? "Breakeven",
            tradeDate: trade.trade_date ?? todayLocal(),
            tradeTime: (trade.trade_time ?? timeLocal()).slice(0, 5),
            session: trade.session ?? "",
            notes: trade.notes ?? "",
            screenshotUrl: trade.screenshot_url ?? "",
            leakIds: trade.leak_ids,
          });
        } else if (options.strategies[0]) {
          setForm((current) => ({ ...current, strategyId: options.strategies[0].id }));
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to prepare trade form.");
      } finally {
        setLoading(false);
      }
    })();
  }, [tradeId]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleLeak(id: string) {
    setForm((current) => ({
      ...current,
      leakIds: current.leakIds.includes(id)
        ? current.leakIds.filter((item) => item !== id)
        : [...current.leakIds, id],
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const entry = Number(form.entryPrice);
    const exit = Number(form.exitPrice);
    const netPnl = Number(form.netPnl);
    if (!form.symbol.trim() || !Number.isFinite(entry) || entry < 0 || !Number.isFinite(exit) || exit < 0 || !Number.isFinite(netPnl)) {
      setError("Enter a symbol, valid entry/exit prices, and a valid net P&L.");
      return;
    }
    if (!form.strategyId) {
      setError("Choose a strategy.");
      return;
    }

    setSaving(true);
    setError(null);
    let newScreenshotPath = "";

    try {
      let screenshotPath = form.screenshotUrl;
      if (screenshot) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) throw new Error("You must be signed in to upload a screenshot.");
        if (screenshot.size > 10 * 1024 * 1024) throw new Error("Screenshot must be 10 MB or smaller.");

        const extension = screenshot.name.split(".").pop()?.toLowerCase() || "png";
        newScreenshotPath = `${userData.user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("trade-screenshots")
          .upload(newScreenshotPath, screenshot, { upsert: false });
        if (uploadError) throw uploadError;
        screenshotPath = newScreenshotPath;
      }

      const savedId = await saveTrade(supabase, {
        tradeId: tradeId ?? null,
        symbol: form.symbol.trim().toUpperCase(),
        direction: form.direction,
        entryPrice: entry,
        exitPrice: exit,
        positionSize: optionalNumber(form.positionSize),
        stopLoss: optionalNumber(form.stopLoss),
        takeProfit: optionalNumber(form.takeProfit),
        netPnl,
        rMultiple: calculatedR,
        strategyId: form.strategyId,
        outcome: form.outcome,
        tradeDate: form.tradeDate,
        tradeTime: form.tradeTime,
        session: form.session,
        notes: form.notes,
        screenshotUrl: screenshotPath,
        leakIds: form.leakIds,
      });

      if (newScreenshotPath && form.screenshotUrl && form.screenshotUrl !== newScreenshotPath) {
        await supabase.storage.from("trade-screenshots").remove([form.screenshotUrl]);
      }

      window.dispatchEvent(new CustomEvent("trader-analytics:trade-logged"));
      window.location.assign(`/trades/${savedId}/`);
    } catch (caught) {
      if (newScreenshotPath) await supabase.storage.from("trade-screenshots").remove([newScreenshotPath]);
      setError(caught instanceof Error ? caught.message : "Unable to save trade.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="grid min-h-96 place-items-center rounded-2xl border border-slate-800 bg-slate-950/65"><Loader2 className="animate-spin text-emerald-400" /></div>;
  }

  const inputClass = "h-11 w-full rounded-xl border border-slate-800 bg-slate-900/75 px-3.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500/50";
  const labelClass = "mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-800 bg-slate-950/65 p-5 shadow-xl shadow-black/10 sm:p-6">
      <section>
        <h2 className="mb-4 text-sm font-semibold text-slate-200">Execution</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="sm:col-span-2 lg:col-span-1"><span className={labelClass}>Symbol</span><input value={form.symbol} onChange={(e) => setField("symbol", e.target.value.toUpperCase())} placeholder="BTCUSD" className={inputClass} required /></label>
          <div><span className={labelClass}>Direction</span><div className="grid grid-cols-2 rounded-xl border border-slate-800 bg-slate-900/75 p-1">{(["Long","Short"] as const).map((direction) => <button key={direction} type="button" onClick={() => setField("direction", direction)} className={`h-9 rounded-lg text-sm font-bold transition ${form.direction === direction ? direction === "Long" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400" : "text-slate-500 hover:text-slate-300"}`}>{direction}</button>)}</div></div>
          <label><span className={labelClass}>Strategy</span><select value={form.strategyId} onChange={(e) => setField("strategyId", e.target.value)} className={inputClass} required>{strategies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label><span className={labelClass}>Outcome</span><select value={form.outcome} onChange={(e) => setField("outcome", e.target.value as FormState["outcome"])} className={inputClass}><option>Win</option><option>Loss</option><option>Breakeven</option></select></label>
          <label><span className={labelClass}>Entry price</span><input type="number" step="any" min="0" value={form.entryPrice} onChange={(e) => setField("entryPrice", e.target.value)} className={inputClass} required /></label>
          <label><span className={labelClass}>Exit price</span><input type="number" step="any" min="0" value={form.exitPrice} onChange={(e) => setField("exitPrice", e.target.value)} className={inputClass} required /></label>
          <label><span className={labelClass}>Position size</span><input type="number" step="any" min="0" value={form.positionSize} onChange={(e) => setField("positionSize", e.target.value)} className={inputClass} /></label>
          <label><span className={labelClass}>Net P&amp;L</span><input type="number" step="0.01" value={form.netPnl} onChange={(e) => setField("netPnl", e.target.value)} className={inputClass} required /></label>
          <label><span className={labelClass}>Stop loss</span><input type="number" step="any" min="0" value={form.stopLoss} onChange={(e) => setField("stopLoss", e.target.value)} className={inputClass} /></label>
          <label><span className={labelClass}>Take profit</span><input type="number" step="any" min="0" value={form.takeProfit} onChange={(e) => setField("takeProfit", e.target.value)} className={inputClass} /></label>
          <div className="rounded-xl border border-slate-800 bg-slate-900/45 px-3.5 py-2.5"><span className={labelClass}>Calculated R</span><p className={`text-sm font-bold ${calculatedR == null ? "text-slate-600" : calculatedR >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{calculatedR == null ? "Add a valid stop" : `${calculatedR.toFixed(2)}R`}</p></div>
        </div>
      </section>

      <section className="border-t border-slate-800 pt-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-200">Context</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label><span className={labelClass}>Date</span><input type="date" value={form.tradeDate} onChange={(e) => setField("tradeDate", e.target.value)} className={`${inputClass} [color-scheme:dark]`} required /></label>
          <label><span className={labelClass}>Time</span><input type="time" value={form.tradeTime} onChange={(e) => setField("tradeTime", e.target.value)} className={`${inputClass} [color-scheme:dark]`} required /></label>
          <label><span className={labelClass}>Session</span><input value={form.session} onChange={(e) => setField("session", e.target.value)} placeholder="New York / London / Asia" className={inputClass} /></label>
          <label className="sm:col-span-2 lg:col-span-3"><span className={labelClass}>Notes</span><textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} rows={5} placeholder="Plan, execution, emotions, what you would repeat or change…" className="w-full resize-y rounded-xl border border-slate-800 bg-slate-900/75 px-3.5 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500/50" /></label>
        </div>
      </section>

      <section className="border-t border-slate-800 pt-6">
        <h2 className="mb-1 text-sm font-semibold text-slate-200">Leak / mistake tags</h2>
        <p className="mb-4 text-xs text-slate-500">Only losing trades contribute financial cost in the Leak Tracker.</p>
        <div className="flex flex-wrap gap-2">{leaks.map((leak) => { const selected = form.leakIds.includes(leak.id); return <button type="button" key={leak.id} onClick={() => toggleLeak(leak.id)} className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${selected ? "border-rose-500/30 bg-rose-500/10 text-rose-300" : "border-slate-800 bg-slate-900/60 text-slate-500 hover:text-slate-300"}`}>{selected ? <X className="mr-1 inline" size={12} /> : null}{leak.name}</button>; })}</div>
      </section>

      <section className="border-t border-slate-800 pt-6">
        <label className="block"><span className={labelClass}>Screenshot</span><div className="flex min-h-24 cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/45 px-4 text-center transition hover:border-slate-600"><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)} className="sr-only" /><div><Camera className="mx-auto mb-2 text-slate-600" size={20} /><p className="text-sm font-medium text-slate-300">{screenshot?.name ?? (form.screenshotUrl ? "Replace existing screenshot" : "Choose trade screenshot")}</p><p className="mt-1 text-xs text-slate-600">PNG, JPG, WebP or GIF • max 10 MB</p></div></div></label>
      </section>

      {error ? <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p> : null}

      <div className="flex justify-end border-t border-slate-800 pt-5"><button type="submit" disabled={saving} className="inline-flex h-11 min-w-36 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-bold text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-60">{saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}{tradeId ? "Save changes" : "Save trade"}</button></div>
    </form>
  );
}
