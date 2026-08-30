import type { SupabaseClient } from "@supabase/supabase-js";

export interface StrategyOption {
  id: string;
  name: string;
}

export interface LeakOption {
  id: string;
  name: string;
}

export interface TradeDetailsRecord {
  id: string;
  symbol: string;
  direction: "Long" | "Short";
  entry_price: number;
  exit_price: number;
  position_size: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  net_pnl: number;
  r_multiple: number | null;
  strategy_id: string | null;
  strategy_tag: string;
  outcome: "Win" | "Loss" | "Breakeven" | null;
  trade_date: string | null;
  trade_time: string | null;
  session: string | null;
  notes: string | null;
  screenshot_url: string | null;
  created_at: string;
  updated_at: string;
  leak_ids: string[];
  leak_names: string[];
}

export interface SaveTradeInput {
  tradeId: string | null;
  symbol: string;
  direction: "Long" | "Short";
  entryPrice: number;
  exitPrice: number;
  positionSize: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  netPnl: number;
  rMultiple: number | null;
  strategyId: string;
  outcome: "Win" | "Loss" | "Breakeven";
  tradeDate: string;
  tradeTime: string;
  session: string;
  notes: string;
  screenshotUrl: string;
  leakIds: string[];
}

function numberOrNull(value: unknown): number | null {
  return value == null || value === "" ? null : Number(value);
}

export async function fetchTradeFormOptions(supabase: SupabaseClient) {
  const [strategiesResult, leaksResult] = await Promise.all([
    supabase.from("strategies").select("id,name").order("name"),
    supabase.from("leaks").select("id,name").order("name"),
  ]);

  if (strategiesResult.error) throw strategiesResult.error;
  if (leaksResult.error) throw leaksResult.error;

  return {
    strategies: (strategiesResult.data ?? []).map((row) => ({ id: String(row.id), name: String(row.name) })),
    leaks: (leaksResult.data ?? []).map((row) => ({ id: String(row.id), name: String(row.name) })),
  } satisfies { strategies: StrategyOption[]; leaks: LeakOption[] };
}

export async function fetchTradeDetails(
  supabase: SupabaseClient,
  tradeId: string,
): Promise<TradeDetailsRecord> {
  const [tradeResult, leaksResult] = await Promise.all([
    supabase
      .from("trades")
      .select("id,symbol,direction,entry_price,exit_price,position_size,stop_loss,take_profit,net_pnl,r_multiple,strategy_id,strategy_tag,outcome,trade_date,trade_time,session,notes,screenshot_url,created_at,updated_at")
      .eq("id", tradeId)
      .single(),
    supabase
      .from("trade_leaks")
      .select("leak_id,leak_tag")
      .eq("trade_id", tradeId)
      .order("created_at"),
  ]);

  if (tradeResult.error) throw tradeResult.error;
  if (leaksResult.error) throw leaksResult.error;

  const row = tradeResult.data;
  const tradeLeaks = leaksResult.data ?? [];

  return {
    id: String(row.id),
    symbol: String(row.symbol),
    direction: row.direction as "Long" | "Short",
    entry_price: Number(row.entry_price),
    exit_price: Number(row.exit_price),
    position_size: numberOrNull(row.position_size),
    stop_loss: numberOrNull(row.stop_loss),
    take_profit: numberOrNull(row.take_profit),
    net_pnl: Number(row.net_pnl),
    r_multiple: numberOrNull(row.r_multiple),
    strategy_id: row.strategy_id == null ? null : String(row.strategy_id),
    strategy_tag: String(row.strategy_tag),
    outcome: row.outcome == null ? null : (row.outcome as TradeDetailsRecord["outcome"]),
    trade_date: row.trade_date == null ? null : String(row.trade_date),
    trade_time: row.trade_time == null ? null : String(row.trade_time),
    session: row.session == null ? null : String(row.session),
    notes: row.notes == null ? null : String(row.notes),
    screenshot_url: row.screenshot_url == null ? null : String(row.screenshot_url),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    leak_ids: tradeLeaks.flatMap((item) => (item.leak_id ? [String(item.leak_id)] : [])),
    leak_names: tradeLeaks.map((item) => String(item.leak_tag)),
  };
}

export async function saveTrade(supabase: SupabaseClient, input: SaveTradeInput): Promise<string> {
  const { data, error } = await supabase.rpc("save_trade", {
    p_trade_id: input.tradeId,
    p_symbol: input.symbol,
    p_direction: input.direction,
    p_entry_price: input.entryPrice,
    p_exit_price: input.exitPrice,
    p_position_size: input.positionSize,
    p_stop_loss: input.stopLoss,
    p_take_profit: input.takeProfit,
    p_net_pnl: input.netPnl,
    p_r_multiple: input.rMultiple,
    p_strategy_id: input.strategyId,
    p_outcome: input.outcome,
    p_trade_date: input.tradeDate,
    p_trade_time: input.tradeTime,
    p_session: input.session,
    p_notes: input.notes,
    p_screenshot_url: input.screenshotUrl,
    p_leak_ids: input.leakIds,
  });

  if (error) throw error;
  if (!data) throw new Error("Trade save did not return an ID.");
  return String(data);
}

export async function deleteTrade(supabase: SupabaseClient, tradeId: string) {
  const { error } = await supabase.from("trades").delete().eq("id", tradeId);
  if (error) throw error;
}

export async function createTradeScreenshotUrl(supabase: SupabaseClient, path: string) {
  const { data, error } = await supabase.storage.from("trade-screenshots").createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}
