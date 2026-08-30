export const STRATEGIES = ["Breakout", "Reversal", "Trend Following"] as const;
export type StrategyTag = (typeof STRATEGIES)[number];

export const LEAK_TAGS = ["FOMO", "Chasing", "Stopped out early", "Revenge trade"] as const;
export type LeakTag = (typeof LEAK_TAGS)[number];

export const DIRECTIONS = ["Long", "Short"] as const;
export type Direction = (typeof DIRECTIONS)[number];
