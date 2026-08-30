import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export default function Panel({ title, description, children, className = "", action }: PanelProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-950/60 shadow-xl shadow-black/10 backdrop-blur-sm ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />
      <div className="flex flex-col gap-3 border-b border-slate-800/80 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-100">{title}</h2>
          {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}
