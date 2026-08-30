"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import TradePagination from "@/components/trade/TradePagination";
import TradeTable from "@/components/trade/TradeTable";
import TradeToolbar from "@/components/trade/TradeToolbar";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  fetchStrategyNames,
  fetchTradePage,
  type TradeFilters,
  type TradeListItem,
  type TradeSort,
} from "@/lib/services/trade-service";

const PAGE_SIZE = 15;
const DEFAULT_FILTERS: TradeFilters = {
  search: "",
  direction: "all",
  strategy: "all",
  outcome: "all",
  startDate: "",
  endDate: "",
};
const DEFAULT_SORT: TradeSort = { field: "trade_date", direction: "desc" };

export default function TradeJournal() {
  const [filters, setFilters] = useState<TradeFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<TradeSort>(DEFAULT_SORT);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<TradeListItem[]>([]);
  const [count, setCount] = useState(0);
  const [strategies, setStrategies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  const loadTrades = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchTradePage(supabase, filters, sort, page, PAGE_SIZE);
      setRows(result.rows);
      setCount(result.count);

      const totalPages = Math.max(1, Math.ceil(result.count / PAGE_SIZE));
      if (page > totalPages) setPage(totalPages);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load trades.");
    } finally {
      setLoading(false);
    }
  }, [filters, page, sort]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    void fetchStrategyNames(supabase).then(setStrategies).catch(() => setStrategies([]));
  }, []);

  useEffect(() => {
    void loadTrades();
  }, [loadTrades]);

  useEffect(() => {
    setPage(1);
  }, [filterKey, sort.field, sort.direction]);

  useEffect(() => {
    const refresh = () => void loadTrades();
    window.addEventListener("trader-analytics:trade-logged", refresh);
    return () => window.removeEventListener("trader-analytics:trade-logged", refresh);
  }, [loadTrades]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/65 shadow-xl shadow-black/10">
      <TradeToolbar
        filters={filters}
        sort={sort}
        strategies={strategies}
        onFiltersChange={setFilters}
        onSortChange={setSort}
        onReset={() => {
          setFilters(DEFAULT_FILTERS);
          setSort(DEFAULT_SORT);
          setPage(1);
        }}
      />

      {error ? (
        <div className="border-b border-rose-500/20 bg-rose-500/[0.06] px-5 py-3 text-sm text-rose-300">{error}</div>
      ) : null}

      <TradeTable rows={rows} loading={loading} />
      <TradePagination page={page} pageSize={PAGE_SIZE} count={count} onPageChange={setPage} />
    </section>
  );
}
