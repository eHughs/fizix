import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  SUPABASE_CONFIGURED,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from "@/lib/supabase/env";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!SUPABASE_CONFIGURED) return null;
  if (browserClient) return browserClient;

  browserClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}

export { SUPABASE_CONFIGURED };
