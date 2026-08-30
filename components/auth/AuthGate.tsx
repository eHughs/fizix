"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthGate({ children }: { children: ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      window.location.replace("/login/");
      return;
    }

    let mounted = true;

    void supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;

      if (error || !data.user) {
        window.location.replace("/login/");
        return;
      }

      setAuthorized(true);
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session?.user) {
        setAuthorized(false);
        window.location.replace("/login/");
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (checking || !authorized) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-slate-400">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 animate-spin text-emerald-400" size={26} />
          <p className="text-sm font-medium">Checking your session…</p>
        </div>
      </main>
    );
  }

  return children;
}
