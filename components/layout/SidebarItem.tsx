"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

interface SidebarItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  onNavigate?: () => void;
}

export default function SidebarItem({
  href,
  label,
  icon: Icon,
  onNavigate,
}: SidebarItemProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-slate-800 text-slate-50 shadow-sm shadow-black/20"
          : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={`grid h-8 w-8 place-items-center rounded-lg border transition-colors ${
          active
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            : "border-slate-800 bg-slate-950 text-slate-500 group-hover:text-slate-300"
        }`}
      >
        <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
      </span>
      <span>{label}</span>
    </Link>
  );
}
