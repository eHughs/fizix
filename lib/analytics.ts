import { STRATEGIES, type StrategyTag } from "@/lib/constants";
import { toFiniteNumber } from "@/lib/format";

export type AnalyticsTrade = {
  strategy_tag: StrategyTag;
  net_pnl: number | string;
  risk_reward?: number | string | null;
};

export type StrategyMetrics = {
  strategy: StrategyTag;
  totalTrades: number;
  wins: number;
  winRate: number;
  averageRiskReward: number | null;
  netPnl: number;
};

export function buildStrategyMetrics(trades: AnalyticsTrade[]): StrategyMetrics[] {
  return STRATEGIES.map((strategy) => {
    const matching = trades.filter((trade) => trade.strategy_tag === strategy);
    const wins = matching.filter((trade) => toFiniteNumber(trade.net_pnl) > 0).length;
    const netPnl = matching.reduce((sum, trade) => sum + toFiniteNumber(trade.net_pnl), 0);
    const rrValues = matching
      .filter((trade) => trade.risk_reward !== null && trade.risk_reward !== undefined && trade.risk_reward !== "")
      .map((trade) => toFiniteNumber(trade.risk_reward))
      .filter((value) => value > 0);

    return {
      strategy,
      totalTrades: matching.length,
      wins,
      winRate: matching.length > 0 ? (wins / matching.length) * 100 : 0,
      averageRiskReward:
        rrValues.length > 0 ? rrValues.reduce((sum, value) => sum + value, 0) / rrValues.length : null,
      netPnl,
    };
  });
}

export function summarizeTrades(trades: AnalyticsTrade[]) {
  const totalTrades = trades.length;
  const wins = trades.filter((trade) => toFiniteNumber(trade.net_pnl) > 0).length;
  const netPnl = trades.reduce((sum, trade) => sum + toFiniteNumber(trade.net_pnl), 0);
  const strategyMetrics = buildStrategyMetrics(trades);
  const strategiesWithTrades = strategyMetrics.filter((item) => item.totalTrades > 0);
  const bestStrategy = strategiesWithTrades.sort((a, b) => b.netPnl - a.netPnl)[0] ?? null;

  return {
    totalTrades,
    wins,
    winRate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
    netPnl,
    averagePnl: totalTrades > 0 ? netPnl / totalTrades : 0,
    bestStrategy,
  };
}
