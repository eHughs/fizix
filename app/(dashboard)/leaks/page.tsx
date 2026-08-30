import LeakTracker from "@/components/LeakTracker";
import PageHeader from "@/components/layout/PageHeader";

export default function LeaksPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Mistake analysis"
        title="Leak Tracker"
        description="See which recurring mistakes are costing the most money, ranked from your real losing-trade data."
      />
      <LeakTracker />
    </div>
  );
}
