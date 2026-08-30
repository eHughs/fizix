const DEFAULT_SUPABASE_URL = "https://bekaoohyvuqrqezhcodj.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_q0EsOV2mau_P5TUdlyrArA_J9SdZaEp";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  DEFAULT_SUPABASE_PUBLISHABLE_KEY;

export const SUPABASE_CONFIGURED = Boolean(
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY,
);
