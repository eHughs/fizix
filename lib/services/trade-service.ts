import type { SupabaseClient } from "@supabase/supabase-js";

export type TradeDirection = "Long" | "Short";
export type TradeOutcome = "Win" | "Loss" | "Breakeven";
export type TradeSortField = "trade_date" | "net_pnl" | "symbol" | "created_at";
export type SortDirection = "asc" | "desc";

export interface TradeListItem {
  id: string;
  symbol: string;
  direction: TradeDirection;
  strategy_tag: string;
  net_pnl: number;
  r_multiple: number | null;
  risk_reward: number | null;
  outcome: TradeOutcome | null;
  trade_date: string | null;
  trade_time: string | null;
  session: string | null;
  created_at: string;
}

export interface TradeFilters {
  search: string;
  direction: "all" | TradeDirection;
  strategy: string;
  outcome: "all" | TradeOutcome;
  startDate: string;
  endDate: string;
}

export interface TradeSort {
  field: TradeSortField;
  direction: SortDirection;
}

export interface TradePageResult {
  rows: TradeListItem[];
  count: number;
}

const SELECT_COLUMNS =
  "id,symbol,direction,strategy_tag,net_pnl,r_multiple,risk_reward,outcome,trade_date,trade_time,session,created_at";

function applyFilters(
  query: ReturnType<SupabaseClient["from"]>["select"] extends never ? never : any,
  filters: TradeFilters,
) {
  let next = query;

  const search = filters.search.trim();
  if (search) {
    const escaped = search.replaceAll(",", " ").trim();
    next = next.or(`symbol.ilike.%${escaped}%,strategy_tag.ilike.%${escaped}%`);
  }

  if (filters.direction !== "all") next = next.eq("direction", filters.direction);
  if (filters.strategy !== "all") next = next.eq("strategy_tag", filters.strategy);
  if (filters.outcome !== "all") next = next.eq("outcome", filters.outcome);
  if (filters.startDate) next = next.gte("trade_date", filters.startDate);
  if (filters.endDate) next = next.lte("trade_date", filters.endDate);

  return next;
}

export async function fetchTradePage(
  supabase: SupabaseClient,
  filters: TradeFilters,
  sort: TradeSort,
  page: number,
  pageSize: number,
): Promise<TradePageResult> {
  const from = Math.max(0, (page - 1) * pageSize);
  const to = from + pageSize - 1;

  let query = supabase
    .from("trades")
    .select(SELECT_COLUMNS, { count: "exact" });

  query = applyFilters(query, filters)
    .order(sort.field, { ascending: sort.direction === "asc" })
    .range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    rows: (data ?? []).map((row) => ({
      ...row,
      net_pnl: Number(row.net_pnl),
      r_multiple: row.r_multiple == null ? null : Number(row.r_multiple),
      risk_reward: row.risk_reward == null ? null : Number(row.risk_reward),
    })) as TradeListItem[],
    count: count ?? 0,
  };
}

export async function fetchFilteredTradesForExport(
  supabase: SupabaseClient,
  filters: TradeFilters,
  sort: TradeSort,
): Promise<TradeListItem[]> {
  let query = supabase.from("trades").select(SELECT_COLUMNS);
  query = applyFilters(query, filters).order(sort.field, {
    ascending: sort.direction === "asc",
  });

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...row,
    net_pnl: Number(row.net_pnl),
    r_multiple: row.r_multiple == null ? null : Number(row.r_multiple),
    risk_reward: row.risk_reward == null ? null : Number(row.risk_reward),
  })) as TradeListItem[];
}

export async function fetchStrategyNames(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase.from("strategies").select("name").order("name");
  if (error) throw error;
  return (data ?? []).map((row) => String(row.name));
}
