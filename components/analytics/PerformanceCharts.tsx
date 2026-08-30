"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, LineChart, Loader2, PieChart as PieIcon, TrendingUp } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";

interface TradeChartRow {
  net_pnl: number | string;
  trade_date: string | null;
  created_at: string;
  strategy_tag: string;
  outcome: "Win" | "Loss" | "Breakeven" | null;
}

interface EquityPoint {
  label: string;
  equity: number;
}

interface MonthlyPoint {
  month: string;
  pnl: number;
}

interface StrategyPoint {
  strategy: string;
  pnl: number;
  trades: number;
}

const tooltipStyle = {
  background: "var(--color-slate-950)",
  border: "1px solid var(--color-slate-800)",
  borderRadius: 12,
  color: "var(--color-slate-100)",
  boxShadow: "0 16px 40px rgba(0,0,0,.16)",
};

function ChartCard({ icon: Icon, title, description, children }: {
  icon: typeof LineChart;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/72 p-5 shadow-lg shadow-black/10">
      <div className="mb-5 flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
          <Icon size={17} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
      </div>
      <div className="h-[280px] w-full">{children}</div>
    </article>
  );
}

export default function PerformanceCharts() {
  const [rows, setRows] = useState<TradeChartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        if (alive) {
          setError("Supabase is not configured.");
          setLoading(false);
        }
        return;
      }

      const { data, error: queryError } = await supabase
        .from("trades")
        .select("net_pnl,trade_date,created_at,strategy_tag,outcome")
        .order("trade_date", { ascending: true })
        .order("created_at", { ascending: true });

      if (!alive) return;
      if (queryError) {
        setError(queryError.message);
      } else {
        setRows((data ?? []) as TradeChartRow[]);
      }
      setLoading(false);
    }

    void load();
    return () => {
      alive = false;
    };
  }, []);

  const data = useMemo(() => {
    let equity = 0;
    const equityCurve: EquityPoint[] = rows.map((row, index) => {
      equity += Number(row.net_pnl) || 0;
      const date = row.trade_date ?? row.created_at.slice(0, 10);
      return {
        label: rows.length > 24 ? `${index + 1}` : new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        equity: Number(equity.toFixed(2)),
      };
    });

    const months = new Map<string, number>();
    const strategies = new Map<string, { pnl: number; trades: number }>();
    let wins = 0;
    let losses = 0;
    let breakeven = 0;

    for (const row of rows) {
      const pnl = Number(row.net_pnl) || 0;
      const date = row.trade_date ?? row.created_at.slice(0, 10);
      const key = date.slice(0, 7);
      months.set(key, (months.get(key) ?? 0) + pnl);

      const strategy = row.strategy_tag || "Unassigned";
      const current = strategies.get(strategy) ?? { pnl: 0, trades: 0 };
      current.pnl += pnl;
      current.trades += 1;
      strategies.set(strategy, current);

      if (row.outcome === "Win" || pnl > 0) wins += 1;
      else if (row.outcome === "Loss" || pnl < 0) losses += 1;
      else breakeven += 1;
    }

    const monthly: MonthlyPoint[] = Array.from(months.entries()).map(([month, pnl]) => ({
      month: new Date(`${month}-01T12:00:00`).toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
      pnl: Number(pnl.toFixed(2)),
    }));

    const strategy: StrategyPoint[] = Array.from(strategies.entries())
      .map(([name, value]) => ({ strategy: name, pnl: Number(value.pnl.toFixed(2)), trades: value.trades }))
      .sort((a, b) => b.pnl - a.pnl);

    return {
      equityCurve,
      monthly,
      strategy,
      outcomes: [
        { name: "Wins", value: wins },
        { name: "Losses", value: losses },
        { name: "Breakeven", value: breakeven },
      ].filter((item) => item.value > 0),
    };
  }, [rows]);

  if (loading) {
    return (
      <div className="grid min-h-64 place-items-center rounded-2xl border border-slate-800 bg-slate-950/65 text-slate-500">
        <div className="flex items-center gap-2 text-sm"><Loader2 className="animate-spin" size={17} /> Building your charts…</div>
      </div>
    );
  }

  if (error) {
    return <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-5 text-sm text-rose-300">Charts could not load: {error}</div>;
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/65 p-8 text-center">
        <TrendingUp className="mx-auto text-amber-400" size={28} />
        <h2 className="mt-4 text-base font-semibold text-slate-100">Your charts will build as you trade</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Log your first trade to generate an equity curve, monthly performance, win/loss distribution, and strategy comparison.</p>
      </div>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-2" aria-label="Performance charts">
      <ChartCard icon={LineChart} title="Equity curve" description="Cumulative realized P&L across your recorded trades.">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.equityCurve} margin={{ top: 8, right: 6, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-amber-500)" stopOpacity={0.32} />
                <stop offset="100%" stopColor="var(--color-amber-500)" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 5" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} fontSize={11} />
            <YAxis tickLine={false} axisLine={false} width={58} fontSize={11} tickFormatter={(value) => `$${Number(value).toLocaleString()}`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatCurrency(Number(value)), "Equity"]} />
            <Area type="monotone" dataKey="equity" stroke="var(--color-amber-500)" strokeWidth={2.5} fill="url(#equityFill)" activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard icon={PieIcon} title="Win / loss distribution" description="Outcome mix across every recorded execution.">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data.outcomes} dataKey="value" nameKey="name" innerRadius="57%" outerRadius="80%" paddingAngle={3} stroke="none">
              {data.outcomes.map((item) => (
                <Cell
                  key={item.name}
                  fill={item.name === "Wins" ? "var(--color-emerald-500)" : item.name === "Losses" ? "var(--color-rose-500)" : "var(--color-slate-500)"}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard icon={BarChart3} title="Monthly performance" description="Realized net P&L grouped by trading month.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.monthly} margin={{ top: 8, right: 6, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 5" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis tickLine={false} axisLine={false} width={58} fontSize={11} tickFormatter={(value) => `$${Number(value).toLocaleString()}`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatCurrency(Number(value)), "Net P&L"]} />
            <Bar dataKey="pnl" radius={[6, 6, 2, 2]} fill="var(--color-amber-500)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard icon={TrendingUp} title="Strategy performance" description="Net P&L by setup, ranked by financial contribution.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.strategy} layout="vertical" margin={{ top: 8, right: 12, left: 16, bottom: 0 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 5" />
            <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} tickFormatter={(value) => `$${Number(value).toLocaleString()}`} />
            <YAxis type="category" dataKey="strategy" tickLine={false} axisLine={false} width={105} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatCurrency(Number(value)), "Net P&L"]} />
            <Bar dataKey="pnl" radius={[2, 7, 7, 2]} fill="var(--color-amber-500)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  );
}
