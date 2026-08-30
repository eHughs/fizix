"use client";

import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  LayoutDashboard,
  ListChecks,
  Settings,
  ShieldAlert,
  X,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import SidebarItem from "@/components/layout/SidebarItem";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trades", label: "Trades", icon: ListChecks },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/leaks", label: "Leak Tracker", icon: ShieldAlert },
  { href: "/playbook", label: "Playbook", icon: BookOpenCheck },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[282px] flex-col border-r border-slate-800/90 bg-slate-950/96 px-4 pb-4 pt-5 shadow-2xl shadow-black/30 transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-7 flex items-center justify-between px-1">
          <BrandLogo size={42} compact />

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-800 text-slate-400 transition hover:border-amber-500/25 hover:bg-slate-900 hover:text-amber-400 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="space-y-1" aria-label="Main navigation">
          {navigation.map((item) => (
            <SidebarItem key={item.href} {...item} onNavigate={onClose} />
          ))}
        </nav>

        <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Journal workspace
          </div>
          <p className="text-xs leading-5 text-slate-500">
            Build a clean record of decisions, execution quality, strategy performance, and recurring mistakes.
          </p>
        </div>
      </aside>
    </>
  );
}
