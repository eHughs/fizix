"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Panel from "@/components/Panel";
import { buildStrategyMetrics, type AnalyticsTrade } from "@/lib/analytics";
import { formatCurrency } from "@/lib/format";
import { getSupabaseClient } from "@/lib/supabase";

type TradeRow = Required<Pick<AnalyticsTrade, "strategy_tag" | "net_pnl">> & {
  risk_reward: number | string | null;
};

export default function PlaybookTable() {
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTrades = useCallback(async (showRefresh = false) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase environment variables are missing.");
      setLoading(false);
      return;
    }

    if (showRefresh) setRefreshing(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from("trades")
      .select("strategy_tag, net_pnl, risk_reward")
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(queryError.message);
    } else {
      setTrades((data ?? []) as TradeRow[]);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadTrades();
    const refresh = () => void loadTrades();
    window.addEventListener("trader-analytics:trade-logged", refresh);
    return () => window.removeEventListener("trader-analytics:trade-logged", refresh);
  }, [loadTrades]);

  const metrics = useMemo(() => buildStrategyMetrics(trades), [trades]);

  return (
    <Panel
      title="Playbook performance"
      description="Compare your core setups by sample size, win rate, realized R:R, and net profitability."
      action={
        <button
          type="button"
          onClick={() => void loadTrades(true)}
          disabled={refreshing}
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-slate-600 hover:bg-slate-900 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      }
    >
      {error ? (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm leading-6 text-rose-300">
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:hidden">
            {metrics.map((row) => (
              <article key={row.strategy} className="rounded-xl border border-slate-800 bg-slate-900/55 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-100">{row.strategy}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {loading ? "Loading…" : `${row.totalTrades} ${row.totalTrades === 1 ? "trade" : "trades"}`}
                    </p>
                  </div>
                  <p
                    className={`text-base font-bold tabular-nums ${
                      row.netPnl > 0 ? "text-emerald-400" : row.netPnl < 0 ? "text-rose-400" : "text-slate-400"
                    }`}
                  >
                    {loading ? "—" : formatCurrency(row.netPnl)}
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-950/60 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">Win rate</p>
                    <p className="mt-1 font-semibold tabular-nums text-slate-300">{loading ? "—" : `${row.winRate.toFixed(1)}%`}</p>
                  </div>
                  <div className="rounded-lg bg-slate-950/60 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">Avg. R:R</p>
                    <p className="mt-1 font-semibold tabular-nums text-slate-300">
                      {loading ? "—" : row.averageRiskReward === null ? "—" : `1:${row.averageRiskReward.toFixed(2)}`}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-[0.12em] text-slate-500">
                  <th className="border-b border-slate-800 px-4 py-3 font-semibold">Setup name</th>
                  <th className="border-b border-slate-800 px-4 py-3 text-right font-semibold">Total trades</th>
                  <th className="border-b border-slate-800 px-4 py-3 text-right font-semibold">Win rate</th>
                  <th className="border-b border-slate-800 px-4 py-3 text-right font-semibold">Avg. R:R</th>
                  <th className="border-b border-slate-800 px-4 py-3 text-right font-semibold">Net P/L</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((row) => (
                  <tr key={row.strategy} className="group transition hover:bg-slate-900/35">
                    <td className="border-b border-slate-800/70 px-4 py-4 font-semibold text-slate-200 group-last:border-b-0">
                      {row.strategy}
                    </td>
                    <td className="border-b border-slate-800/70 px-4 py-4 text-right tabular-nums text-slate-300 group-last:border-b-0">
                      {loading ? "—" : row.totalTrades}
                    </td>
                    <td className="border-b border-slate-800/70 px-4 py-4 text-right tabular-nums text-slate-300 group-last:border-b-0">
                      {loading ? "—" : `${row.winRate.toFixed(1)}%`}
                    </td>
                    <td className="border-b border-slate-800/70 px-4 py-4 text-right tabular-nums text-slate-300 group-last:border-b-0">
                      {loading ? "—" : row.averageRiskReward === null ? "—" : `1:${row.averageRiskReward.toFixed(2)}`}
                    </td>
                    <td
                      className={`border-b border-slate-800/70 px-4 py-4 text-right font-semibold tabular-nums group-last:border-b-0 ${
                        row.netPnl > 0 ? "text-emerald-400" : row.netPnl < 0 ? "text-rose-400" : "text-slate-400"
                      }`}
                    >
                      {loading ? "—" : formatCurrency(row.netPnl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Panel>
  );
}
