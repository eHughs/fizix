"use client";

import { Code2 } from "lucide-react";
import { useEffect, useState } from "react";
import SidebarItem from "@/components/layout/SidebarItem";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const DEVELOPER_ID = "8d8c87ad-432e-4997-8413-5adae8d12e21";
const DEVELOPER_EMAIL = "evanrhughs@gmail.com";

export default function DeveloperNavItem({ onNavigate }: { onNavigate?: () => void }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const user = data.user;
      setAllowed(Boolean(user && user.id === DEVELOPER_ID && user.email?.toLowerCase() === DEVELOPER_EMAIL));
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setAllowed(Boolean(user && user.id === DEVELOPER_ID && user.email?.toLowerCase() === DEVELOPER_EMAIL));
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  if (!allowed) return null;
  return <SidebarItem href="/developer" label="Developer" icon={Code2} onNavigate={onNavigate} />;
}
