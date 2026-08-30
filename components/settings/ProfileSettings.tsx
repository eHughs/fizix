"use client";

import { Loader2, Save, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface ProfileState {
  displayName: string;
  defaultCurrency: string;
  timezone: string;
}

const initialState: ProfileState = {
  displayName: "",
  defaultCurrency: "USD",
  timezone: "America/Chicago",
};

export default function ProfileSettings() {
  const [profile, setProfile] = useState<ProfileState>(initialState);
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    void (async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setError("Unable to load your account.");
        setLoading(false);
        return;
      }

      setUserId(userData.user.id);
      setEmail(userData.user.email ?? "");

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("display_name, default_currency, timezone")
        .eq("id", userData.user.id)
        .single();

      if (profileError) {
        setError(profileError.message);
      } else if (data) {
        setProfile({
          displayName: data.display_name ?? "",
          defaultCurrency: data.default_currency ?? "USD",
          timezone: data.timezone ?? "America/Chicago",
        });
      }

      setLoading(false);
    })();
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: profile.displayName.trim() || null,
        default_currency: profile.defaultCurrency.trim().toUpperCase(),
        timezone: profile.timezone.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Profile settings saved.");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="grid min-h-48 place-items-center rounded-2xl border border-slate-800 bg-slate-950/65">
        <Loader2 className="animate-spin text-emerald-400" size={24} />
      </div>
    );
  }

  return (
    <form onSubmit={saveProfile} className="rounded-2xl border border-slate-800 bg-slate-950/65 p-5 shadow-lg shadow-black/10 sm:p-6">
      <div className="mb-6 flex items-center gap-3 border-b border-slate-800 pb-5">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400">
          <UserRound size={18} />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Profile</h2>
          <p className="mt-1 text-xs text-slate-500">These settings are stored in your user-owned Supabase profile.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Email</span>
          <input disabled value={email} className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900/50 px-3.5 text-sm text-slate-500" />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Display name</span>
          <input
            value={profile.displayName}
            onChange={(event) => setProfile((current) => ({ ...current, displayName: event.target.value }))}
            placeholder="Your name"
            className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-500/50"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Default currency</span>
          <input
            maxLength={3}
            value={profile.defaultCurrency}
            onChange={(event) => setProfile((current) => ({ ...current, defaultCurrency: event.target.value }))}
            className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 text-sm uppercase text-slate-100 outline-none focus:border-emerald-500/50"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Timezone</span>
          <input
            value={profile.timezone}
            onChange={(event) => setProfile((current) => ({ ...current, timezone: event.target.value }))}
            className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
          />
        </label>
      </div>

      {error ? <p className="mt-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-300">{error}</p> : null}
      {message ? <p className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-3 text-sm text-emerald-300">{message}</p> : null}

      <div className="mt-5 flex justify-end">
        <button
          disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-60"
          type="submit"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save profile
        </button>
      </div>
    </form>
  );
}
