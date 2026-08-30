"use client";

import { Menu, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/layout/ThemeToggle";
import UserMenu from "@/components/layout/UserMenu";

interface TopbarProps {
  onOpenNavigation: () => void;
}

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/trades": "Trades",
  "/analytics": "Analytics",
  "/calendar": "Calendar",
  "/leaks": "Leak Tracker",
  "/playbook": "Strategy Playbook",
  "/settings": "Settings",
};

function resolveTitle(pathname: string) {
  const match = Object.entries(titles).find(([path]) => pathname === path || pathname.startsWith(`${path}/`));
  return match?.[1] ?? "Trader Analytics";
}

export default function Topbar({ onOpenNavigation }: TopbarProps) {
  const pathname = usePathname();
  const title = resolveTitle(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/78 backdrop-blur-xl">
      <div className="flex h-[68px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenNavigation}
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 bg-slate-950 text-slate-300 transition hover:border-amber-500/25 hover:text-amber-400 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={19} />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-100 sm:text-base">{title}</p>
          <p className="hidden text-xs text-slate-600 sm:block">Turn execution data into a repeatable trading process.</p>
        </div>

        <Link
          href="/trades/new"
          className="hidden h-10 items-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-bold text-amber-950 shadow-lg shadow-black/10 transition hover:bg-amber-400 sm:inline-flex"
        >
          <Plus size={17} strokeWidth={2.2} />
          New trade
        </Link>

        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
