"use client";

import { useMemo, useState, type FormEvent } from "react";
import Panel from "@/components/Panel";
import { DIRECTIONS, LEAK_TAGS, STRATEGIES, type Direction, type LeakTag, type StrategyTag } from "@/lib/constants";
import { getSupabaseClient } from "@/lib/supabase";

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-3 text-sm text-slate-100 shadow-inner shadow-black/10 transition placeholder:text-slate-600 hover:border-slate-600 focus:border-emerald-400";

export default function TradeLogger() {
  const [symbol, setSymbol] = useState("");
  const [direction, setDirection] = useState<Direction>("Long");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [netPnl, setNetPnl] = useState("");
  const [strategyTag, setStrategyTag] = useState<StrategyTag>("Breakout");
  const [riskReward, setRiskReward] = useState("");
  const [selectedLeaks, setSelectedLeaks] = useState<LeakTag[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isLoss = useMemo(() => Number(netPnl) < 0, [netPnl]);

  function toggleLeak(tag: LeakTag) {
    setSelectedLeaks((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
  }

  function resetForm() {
    setSymbol("");
    setDirection("Long");
    setEntryPrice("");
    setExitPrice("");
    setNetPnl("");
    setStrategyTag("Breakout");
    setRiskReward("");
    setSelectedLeaks([]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setMessage({
        type: "error",
        text: "Supabase is not configured. Add the two NEXT_PUBLIC_SUPABASE variables in Cloudflare.",
      });
      return;
    }

    const normalizedSymbol = symbol.trim().toUpperCase();
    const entry = Number(entryPrice);
    const exit = Number(exitPrice);
    const pnl = Number(netPnl);
    const rr = riskReward.trim() === "" ? null : Number(riskReward);

    if (!normalizedSymbol) {
      setMessage({ type: "error", text: "Enter a symbol before saving the trade." });
      return;
    }

    if (!Number.isFinite(entry) || entry < 0 || !Number.isFinite(exit) || exit < 0 || !Number.isFinite(pnl)) {
      setMessage({ type: "error", text: "Entry, exit, and P&L must contain valid numbers." });
      return;
    }

    if (rr !== null && (!Number.isFinite(rr) || rr < 0)) {
      setMessage({ type: "error", text: "Risk:Reward must be a positive number, such as 2 for 1:2." });
      return;
    }

    setSubmitting(true);

    try {
      const { data: trade, error: tradeError } = await supabase
        .from("trades")
        .insert({
          symbol: normalizedSymbol,
          direction,
          entry_price: entry,
          exit_price: exit,
          net_pnl: pnl,
          strategy_tag: strategyTag,
          risk_reward: rr,
        })
        .select("id")
        .single();

      if (tradeError) throw tradeError;

      if (selectedLeaks.length > 0) {
        const totalLoss = pnl < 0 ? Math.abs(pnl) : 0;
        const allocatedLoss = totalLoss / selectedLeaks.length;

        const leakRows = selectedLeaks.map((leakTag) => ({
          trade_id: trade.id,
          leak_tag: leakTag,
          loss_amount: Number(allocatedLoss.toFixed(2)),
        }));

        const { error: leaksError } = await supabase.from("trade_leaks").insert(leakRows);
        if (leaksError) throw new Error(`Trade saved, but leak tags failed to save: ${leaksError.message}`);
      }

      resetForm();
      setMessage({ type: "success", text: "Trade logged successfully. Analytics have been refreshed." });
      window.dispatchEvent(new Event("trader-analytics:trade-logged"));
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to save this trade.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Panel
      title="Log a trade"
      description="Record execution, outcome, setup, and any behavioral leaks while the details are fresh."
      className="h-full"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-300">
            Symbol
            <input
              value={symbol}
              onChange={(event) => setSymbol(event.target.value.toUpperCase())}
              className={inputClass}
              placeholder="BTCUSD"
              maxLength={20}
              autoComplete="off"
              required
            />
          </label>

          <div>
            <span className="text-sm font-medium text-slate-300">Direction</span>
            <div className="mt-2 grid grid-cols-2 rounded-xl border border-slate-700 bg-slate-900 p-1">
              {DIRECTIONS.map((item) => {
                const active = direction === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setDirection(item)}
                    className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? item === "Long"
                          ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                          : "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="text-sm font-medium text-slate-300">
            Entry price
            <input
              type="number"
              min="0"
              step="any"
              value={entryPrice}
              onChange={(event) => setEntryPrice(event.target.value)}
              className={inputClass}
              placeholder="64250.00"
              required
            />
          </label>

          <label className="text-sm font-medium text-slate-300">
            Exit price
            <input
              type="number"
              min="0"
              step="any"
              value={exitPrice}
              onChange={(event) => setExitPrice(event.target.value)}
              className={inputClass}
              placeholder="65100.00"
              required
            />
          </label>

          <label className="text-sm font-medium text-slate-300">
            Net P&amp;L ($)
            <input
              type="number"
              step="0.01"
              value={netPnl}
              onChange={(event) => setNetPnl(event.target.value)}
              className={`${inputClass} ${isLoss ? "text-rose-400" : netPnl ? "text-emerald-400" : ""}`}
              placeholder="250.00 or -125.00"
              required
            />
          </label>

          <label className="text-sm font-medium text-slate-300">
            Strategy tag
            <select
              value={strategyTag}
              onChange={(event) => setStrategyTag(event.target.value as StrategyTag)}
              className={inputClass}
            >
              {STRATEGIES.map((strategy) => (
                <option key={strategy}>{strategy}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-300 sm:col-span-2">
            Risk:Reward <span className="font-normal text-slate-500">(optional)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={riskReward}
              onChange={(event) => setRiskReward(event.target.value)}
              className={inputClass}
              placeholder="2.00 = 1:2"
            />
            <span className="mt-1.5 block text-xs leading-5 text-slate-500">
              This optional value powers the average R:R metric in your playbook table.
            </span>
          </label>
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-slate-300">Leak tags</legend>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Select every mistake that affected this trade. Losses are split evenly across selected tags so totals are not double-counted.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {LEAK_TAGS.map((tag) => {
              const active = selectedLeaks.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleLeak(tag)}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? "border-rose-400/40 bg-rose-500/15 text-rose-300"
                      : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </fieldset>

        {message ? (
          <div
            role="status"
            className={`rounded-xl border px-4 py-3 text-sm leading-6 ${
              message.type === "success"
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/25 bg-rose-500/10 text-rose-300"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving trade…" : "Save trade"}
        </button>
      </form>
    </Panel>
  );
}
