import DashboardOverview from "@/components/DashboardOverview";
import PageHeader from "@/components/layout/PageHeader";

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Performance analytics"
        title="Analytics"
        description="Review the core performance metrics already calculated from your Supabase trade history. Deeper charts and filtering are added in the analytics milestone."
      />
      <DashboardOverview />
    </div>
  );
}
