import type { ReactNode } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import ThemeToggle from "@/components/layout/ThemeToggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 text-slate-100 sm:px-6">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-[-8rem] top-[-8rem] h-96 w-96 rounded-full bg-amber-500/[0.08] blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-8rem] h-[28rem] w-[28rem] rounded-full bg-amber-400/[0.045] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="Trader Analytics home">
            <BrandLogo size={44} />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="hidden text-sm font-medium text-slate-500 transition hover:text-amber-400 sm:block">View dashboard</Link>
            <ThemeToggle />
          </div>
        </header>

        <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1fr_28rem]">
          <section className="hidden max-w-xl lg:block">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-amber-400">Trade with evidence</p>
            <h2 className="text-5xl font-bold tracking-[-0.05em] text-white">Turn raw trading data into actionable self-review.</h2>
            <p className="mt-5 text-base leading-7 text-slate-400">
              Journal executions, measure strategy quality, expose expensive habits, and build a repeatable process from your own performance history.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {["Journal", "Analyze", "Improve"].map((item, index) => (
                <div key={item} className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
                  <span className="text-xs font-bold text-amber-400">0{index + 1}</span>
                  <p className="mt-5 text-sm font-semibold text-slate-200">{item}</p>
                </div>
              ))}
            </div>
          </section>
          <div className="flex justify-center lg:justify-end">{children}</div>
        </div>
      </div>
    </main>
  );
}
