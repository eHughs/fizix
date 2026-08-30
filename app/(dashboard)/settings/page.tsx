import { ShieldCheck } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import ProfileSettings from "@/components/settings/ProfileSettings";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Manage the account and trading preferences that belong to your Trader Analytics workspace."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <ProfileSettings />

        <aside className="h-fit rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.045] p-5">
          <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <ShieldCheck size={18} />
          </div>
          <h2 className="text-sm font-semibold text-slate-100">User-owned data is active</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Profile, strategy, leak, trade, and trade-leak rows are protected by owner-based Row Level Security in Supabase. The dashboard only receives rows belonging to the signed-in user.
          </p>
        </aside>
      </div>
    </div>
  );
}
