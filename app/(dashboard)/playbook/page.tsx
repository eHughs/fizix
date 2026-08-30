import PlaybookTable from "@/components/PlaybookTable";
import PageHeader from "@/components/layout/PageHeader";

export default function PlaybookPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Strategy review"
        title="Strategy Playbook"
        description="Compare setup performance from your current trade history. Strategy management and richer rules are added in the playbook milestone."
      />
      <PlaybookTable />
    </div>
  );
}
