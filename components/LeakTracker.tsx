"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Panel from "@/components/Panel";
import { LEAK_TAGS, type LeakTag } from "@/lib/constants";
import { formatCurrency, toFiniteNumber } from "@/lib/format";
import { getSupabaseClient } from "@/lib/supabase";

type LeakRow = {
  leak_tag: LeakTag;
  loss_amount: number | string;
};

type LeakTotal = {
  tag: LeakTag;
  loss: number;
};

export default function LeakTracker() {
  const [rows, setRows] = useState<LeakRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLeaks = useCallback(async (showRefresh = false) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase environment variables are missing.");
      setLoading(false);
      return;
    }

    if (showRefresh) setRefreshing(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from("trade_leaks")
      .select("leak_tag, loss_amount")
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(queryError.message);
    } else {
      setRows((data ?? []) as LeakRow[]);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadLeaks();
    const refresh = () => void loadLeaks();
    window.addEventListener("trader-analytics:trade-logged", refresh);
    return () => window.removeEventListener("trader-analytics:trade-logged", refresh);
  }, [loadLeaks]);

  const totals = useMemo<LeakTotal[]>(() => {
    const byTag = new Map<LeakTag, number>(LEAK_TAGS.map((tag) => [tag, 0]));

    for (const row of rows) {
      if (!LEAK_TAGS.includes(row.leak_tag)) continue;
      byTag.set(row.leak_tag, (byTag.get(row.leak_tag) ?? 0) + toFiniteNumber(row.loss_amount));
    }

    return LEAK_TAGS.map((tag) => ({ tag, loss: byTag.get(tag) ?? 0 })).sort((a, b) => b.loss - a.loss);
  }, [rows]);

  const topMistake = totals[0];
  const maxLoss = Math.max(...totals.map((item) => item.loss), 0);
  const totalLeakCost = totals.reduce((sum, item) => sum + item.loss, 0);

  return (
    <Panel
      title="Leak tracker"
      description="See which behavioral mistakes are costing the most money across losing trades."
      className="h-full"
      action={
        <button
          type="button"
          onClick={() => void loadLeaks(true)}
          disabled={refreshing}
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-slate-600 hover:bg-slate-900 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      }
    >
      {loading ? (
        <div className="space-y-3" aria-label="Loading leak analytics">
          <div className="h-24 animate-pulse rounded-xl bg-slate-900" />
          <div className="h-10 animate-pulse rounded-xl bg-slate-900" />
          <div className="h-10 animate-pulse rounded-xl bg-slate-900" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm leading-6 text-rose-300">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/65 p-4 shadow-inner shadow-black/10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Top-cost mistake</p>
              <p className="mt-2 text-lg font-semibold text-slate-100">
                {topMistake && topMistake.loss > 0 ? topMistake.tag : "No losses yet"}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-rose-400">{formatCurrency(topMistake?.loss ?? 0)}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/65 p-4 shadow-inner shadow-black/10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Tracked leak cost</p>
              <p className="mt-2 text-lg font-semibold text-slate-100">All leak tags</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-200">{formatCurrency(totalLeakCost)}</p>
            </div>
          </div>

          <div className="space-y-4">
            {totals.map((item) => {
              const width = maxLoss > 0 ? Math.max((item.loss / maxLoss) * 100, item.loss > 0 ? 3 : 0) : 0;

              return (
                <div key={item.tag}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-300">{item.tag}</span>
                    <span className="font-semibold tabular-nums text-rose-400">{formatCurrency(item.loss)}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-800/90" aria-hidden="true">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400 transition-[width] duration-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {totalLeakCost === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 px-4 py-3 text-xs leading-5 text-slate-500">
              No losing leak cost has been recorded yet. Tag mistakes on trades and the cost breakdown will appear here.
            </p>
          ) : null}
        </div>
      )}
    </Panel>
  );
}
