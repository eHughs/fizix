"use client";

import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    window.location.replace("/dashboard/");
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 text-slate-400">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />
        <p className="text-sm">Opening Trader Analytics…</p>
      </div>
    </main>
  );
}
