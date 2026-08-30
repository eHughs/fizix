"use client";

import Link from "next/link";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function UserMenu() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.assign("/login/");
  }

  if (loading) {
    return <div className="h-10 w-32 animate-pulse rounded-xl bg-slate-800/80" aria-label="Loading account" />;
  }

  if (!email) {
    return (
      <Link
        href="/login"
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 text-sm font-semibold text-slate-300 transition hover:border-slate-700 hover:text-white"
      >
        <LogIn size={16} aria-hidden="true" />
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 sm:flex">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-800 text-slate-300">
          <UserRound size={15} aria-hidden="true" />
        </span>
        <span className="max-w-48 truncate text-xs font-medium text-slate-300">{email}</span>
      </div>
      <button
        type="button"
        onClick={signOut}
        className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 bg-slate-950/80 text-slate-400 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut size={17} aria-hidden="true" />
      </button>
    </div>
  );
}
