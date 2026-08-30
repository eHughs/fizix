import TradeLogger from "@/components/TradeLogger";
import PageHeader from "@/components/layout/PageHeader";

export default function NewTradePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Trade journal"
        title="Log a trade"
        description="Capture execution details, realized P&L, strategy context, and mistakes while the trade is still fresh."
      />
      <TradeLogger />
    </div>
  );
}
