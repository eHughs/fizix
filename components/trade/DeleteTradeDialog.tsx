"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteTrade } from "@/lib/services/trade-details-service";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function DeleteTradeDialog({ tradeId, screenshotPath }: { tradeId: string; screenshotPath?: string | null }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function removeTrade() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setDeleting(true);
    setError(null);

    try {
      await deleteTrade(supabase, tradeId);
      if (screenshotPath) {
        await supabase.storage.from("trade-screenshots").remove([screenshotPath]);
      }
      window.location.assign("/trades/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete trade.");
      setDeleting(false);
    }
  }

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-3.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10">
        <Trash2 size={16} /> Delete
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-rose-500/25 bg-rose-500/[0.07] p-3">
      <p className="text-xs font-semibold text-rose-200">Delete this trade permanently?</p>
      <div className="mt-2 flex gap-2">
        <button type="button" disabled={deleting} onClick={removeTrade} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-rose-500 px-3 text-xs font-bold text-white disabled:opacity-60">
          {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Delete trade
        </button>
        <button type="button" disabled={deleting} onClick={() => setConfirming(false)} className="h-8 rounded-lg border border-slate-700 px-3 text-xs font-semibold text-slate-400">Cancel</button>
      </div>
      {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
