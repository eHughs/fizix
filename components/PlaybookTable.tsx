"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Panel from "@/components/Panel";
import { STRATEGIES, type StrategyTag } from "@/lib/constants";
import { formatCurrency, toFiniteNumber } from "@/lib/format";
import { getSupabaseClient } from "@/lib/supabase";

type TradeRow = {
  strategy_tag: StrategyTag;
  net_pnl: number | string;
  risk_reward: number | string | null;
};

type StrategyMetrics = {
  strategy: StrategyTag;
  totalTrades: number;
  winRate: number;
  averageRiskReward: number | null;
  netPnl: number;
};

export default function PlaybookTable() {
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrades = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase environment variables are missing.");
      setLoading(false);
      return;
    }

    setError(null);

    const { data, error: queryError } = await supabase
      .from("trades")
      .select("strategy_tag, net_pnl, risk_reward")
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    setTrades((data ?? []) as TradeRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadTrades();
    const refresh = () => void loadTrades();
    window.addEventListener("trader-analytics:trade-logged", refresh);
    return () => window.removeEventListener("trader-analytics:trade-logged", refresh);
  }, [loadTrades]);

  const metrics = useMemo<StrategyMetrics[]>(() => {
    return STRATEGIES.map((strategy) => {
      const matching = trades.filter((trade) => trade.strategy_tag === strategy);
      const wins = matching.filter((trade) => toFiniteNumber(trade.net_pnl) > 0).length;
      const netPnl = matching.reduce((sum, trade) => sum + toFiniteNumber(trade.net_pnl), 0);
      const rrValues = matching
        .filter((trade) => trade.risk_reward !== null && trade.risk_reward !== "")
        .map((trade) => toFiniteNumber(trade.risk_reward));

      return {
        strategy,
        totalTrades: matching.length,
        winRate: matching.length > 0 ? (wins / matching.length) * 100 : 0,
        averageRiskReward:
          rrValues.length > 0 ? rrValues.reduce((sum, value) => sum + value, 0) / rrValues.length : null,
        netPnl,
      };
    });
  }, [trades]);

  return (
    <Panel
      title="Playbook performance"
      description="Compare your core setups by sample size, win rate, realized R:R, and net profitability."
      action={
        <button
          type="button"
          onClick={() => void loadTrades()}
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-slate-600 hover:text-slate-200"
        >
          Refresh
        </button>
      }
    >
      {error ? (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm leading-6 text-rose-300">
          {error}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
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
                <tr key={row.strategy} className="group">
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
      )}
    </Panel>
  );
}
