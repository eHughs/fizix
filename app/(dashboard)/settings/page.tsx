import { Database, Palette, ShieldCheck, UserRound } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Manage account, profile, trading preferences, categories, theme, and export behavior from one place."
      />

      <section className="grid gap-4 md:grid-cols-2">
        {[
          { icon: UserRound, title: "Profile & account", text: "Authentication is active now. User-owned profile records and account settings are added with the owner-based schema in Milestone 2." },
          { icon: Database, title: "Trading preferences", text: "Default currency, session preferences, and data export controls will be stored per user instead of hardcoded in the interface." },
          { icon: ShieldCheck, title: "Privacy & ownership", text: "Milestone 2 replaces the current shared anonymous trading model with user-specific Row Level Security policies." },
          { icon: Palette, title: "Appearance", text: "The professional dark theme is the current baseline; user-selectable theme preferences are added in the settings milestone." },
        ].map(({ icon: Icon, title, text }) => (
          <article key={title} className="rounded-2xl border border-slate-800 bg-slate-950/65 p-5 shadow-lg shadow-black/10">
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400">
              <Icon size={18} />
            </div>
            <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
