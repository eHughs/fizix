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

function sanitizeSearch(value: string) {
  return value.replaceAll(",", " ").replaceAll("%", "").trim();
}

function normalizeRows(rows: Record<string, unknown>[]): TradeListItem[] {
  return rows.map((row) => ({
    id: String(row.id),
    symbol: String(row.symbol),
    direction: row.direction as TradeDirection,
    strategy_tag: String(row.strategy_tag),
    net_pnl: Number(row.net_pnl),
    r_multiple: row.r_multiple == null ? null : Number(row.r_multiple),
    risk_reward: row.risk_reward == null ? null : Number(row.risk_reward),
    outcome: row.outcome == null ? null : (row.outcome as TradeOutcome),
    trade_date: row.trade_date == null ? null : String(row.trade_date),
    trade_time: row.trade_time == null ? null : String(row.trade_time),
    session: row.session == null ? null : String(row.session),
    created_at: String(row.created_at),
  }));
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
  let query = supabase.from("trades").select(SELECT_COLUMNS, { count: "exact" });

  const search = sanitizeSearch(filters.search);
  if (search) query = query.or(`symbol.ilike.%${search}%,strategy_tag.ilike.%${search}%`);
  if (filters.direction !== "all") query = query.eq("direction", filters.direction);
  if (filters.strategy !== "all") query = query.eq("strategy_tag", filters.strategy);
  if (filters.outcome !== "all") query = query.eq("outcome", filters.outcome);
  if (filters.startDate) query = query.gte("trade_date", filters.startDate);
  if (filters.endDate) query = query.lte("trade_date", filters.endDate);

  const { data, error, count } = await query
    .order(sort.field, { ascending: sort.direction === "asc" })
    .range(from, to);

  if (error) throw error;

  return {
    rows: normalizeRows((data ?? []) as Record<string, unknown>[]),
    count: count ?? 0,
  };
}

export async function fetchFilteredTradesForExport(
  supabase: SupabaseClient,
  filters: TradeFilters,
  sort: TradeSort,
): Promise<TradeListItem[]> {
  let query = supabase.from("trades").select(SELECT_COLUMNS);

  const search = sanitizeSearch(filters.search);
  if (search) query = query.or(`symbol.ilike.%${search}%,strategy_tag.ilike.%${search}%`);
  if (filters.direction !== "all") query = query.eq("direction", filters.direction);
  if (filters.strategy !== "all") query = query.eq("strategy_tag", filters.strategy);
  if (filters.outcome !== "all") query = query.eq("outcome", filters.outcome);
  if (filters.startDate) query = query.gte("trade_date", filters.startDate);
  if (filters.endDate) query = query.lte("trade_date", filters.endDate);

  const { data, error } = await query.order(sort.field, {
    ascending: sort.direction === "asc",
  });

  if (error) throw error;
  return normalizeRows((data ?? []) as Record<string, unknown>[]);
}

export async function fetchStrategyNames(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase.from("strategies").select("name").order("name");
  if (error) throw error;
  return (data ?? []).map((row) => String(row.name));
}
