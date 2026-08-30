"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { summarizeTrades, type AnalyticsTrade } from "@/lib/analytics";
import { formatCurrency } from "@/lib/format";
import { getSupabaseClient } from "@/lib/supabase";

type OverviewTrade = Pick<AnalyticsTrade, "strategy_tag" | "net_pnl">;

function MetricCard({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  const toneClass =
    tone === "positive" ? "text-emerald-400" : tone === "negative" ? "text-rose-400" : "text-slate-100";

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-950/65 p-5 shadow-lg shadow-black/10 transition duration-200 hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-950/80">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent opacity-70" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight tabular-nums ${toneClass}`}>{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

export default function DashboardOverview() {
  const [trades, setTrades] = useState<OverviewTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase environment variables are missing.");
      setLoading(false);
      return;
    }

    setError(null);
    const { data, error: queryError } = await supabase
      .from("trades")
      .select("strategy_tag, net_pnl")
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    setTrades((data ?? []) as OverviewTrade[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadOverview();
    const refresh = () => void loadOverview();
    window.addEventListener("trader-analytics:trade-logged", refresh);
    return () => window.removeEventListener("trader-analytics:trade-logged", refresh);
  }, [loadOverview]);

  const summary = useMemo(() => summarizeTrades(trades), [trades]);
  const pnlTone = summary.netPnl > 0 ? "positive" : summary.netPnl < 0 ? "negative" : "neutral";

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading trading overview">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-[118px] animate-pulse rounded-2xl border border-slate-800 bg-slate-950/55" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-300">
        Analytics overview unavailable: {error}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Net P&L"
        value={formatCurrency(summary.netPnl)}
        detail={summary.totalTrades > 0 ? `${formatCurrency(summary.averagePnl)} average per trade` : "Log a trade to start tracking"}
        tone={pnlTone}
      />
      <MetricCard
        label="Total trades"
        value={summary.totalTrades.toLocaleString("en-US")}
        detail={summary.totalTrades === 1 ? "1 journaled execution" : `${summary.totalTrades.toLocaleString("en-US")} journaled executions`}
      />
      <MetricCard
        label="Win rate"
        value={`${summary.winRate.toFixed(1)}%`}
        detail={summary.totalTrades > 0 ? `${summary.wins} winning ${summary.wins === 1 ? "trade" : "trades"}` : "No sample yet"}
        tone={summary.winRate >= 50 && summary.totalTrades > 0 ? "positive" : "neutral"}
      />
      <MetricCard
        label="Best setup"
        value={summary.bestStrategy?.strategy ?? "—"}
        detail={summary.bestStrategy ? `${formatCurrency(summary.bestStrategy.netPnl)} net across ${summary.bestStrategy.totalTrades} trades` : "No setup data yet"}
        tone={summary.bestStrategy && summary.bestStrategy.netPnl > 0 ? "positive" : "neutral"}
      />
    </div>
  );
}
