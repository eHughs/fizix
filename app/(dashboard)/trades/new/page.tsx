import PageHeader from "@/components/layout/PageHeader";
import TradeForm from "@/components/trade/TradeForm";

export default function NewTradePage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Trade journal"
        title="Log a trade"
        description="Capture execution, risk, strategy, session context, review notes, screenshot, and recurring mistakes in one complete journal entry."
      />
      <TradeForm />
    </div>
  );
}
