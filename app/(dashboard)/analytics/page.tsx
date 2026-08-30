import PerformanceCharts from "@/components/analytics/PerformanceCharts";
import DashboardOverview from "@/components/DashboardOverview";
import PageHeader from "@/components/layout/PageHeader";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Performance analytics"
        title="Analytics"
        description="See how your account is actually performing through real Supabase trade data, cumulative equity, monthly results, outcomes, and strategy contribution."
      />
      <DashboardOverview />
      <PerformanceCharts />
    </div>
  );
}
