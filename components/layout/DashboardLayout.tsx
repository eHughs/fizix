"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [navigationOpen, setNavigationOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Sidebar open={navigationOpen} onClose={() => setNavigationOpen(false)} />

      <div className="min-h-screen lg:pl-[282px]">
        <Topbar onOpenNavigation={() => setNavigationOpen(true)} />
        <main className="relative min-h-[calc(100vh-68px)] overflow-hidden">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -left-32 -top-48 h-[30rem] w-[30rem] rounded-full bg-emerald-500/[0.045] blur-3xl" />
            <div className="absolute -right-28 top-16 h-[26rem] w-[26rem] rounded-full bg-sky-500/[0.035] blur-3xl" />
          </div>
          <div className="relative mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
