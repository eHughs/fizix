import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// These are public browser credentials for the connected Trader Analytics project.
// Supabase publishable keys are designed to be shipped in web bundles; data access
// is still controlled by Postgres grants and Row Level Security.
const DEFAULT_SUPABASE_URL = "https://bekaoohyvuqrqezhcodj.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_q0EsOV2mau_P5TUdlyrArA_J9SdZaEp";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  DEFAULT_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (client) return client;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return null;

  client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });

  return client;
}

export const SUPABASE_CONFIGURED = Boolean(
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY,
);
