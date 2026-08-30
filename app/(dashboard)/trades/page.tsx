import Link from "next/link";
import { Plus } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import TradeJournal from "@/components/trade/TradeJournal";

export default function TradesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Trade journal"
        title="Trades"
        description="Search, filter, sort, review, and export your user-owned execution history from Supabase."
        action={
          <Link
            href="/trades/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-emerald-950 transition hover:bg-emerald-400"
          >
            <Plus size={16} />
            Log a trade
          </Link>
        }
      />
      <TradeJournal />
    </div>
  );
}
