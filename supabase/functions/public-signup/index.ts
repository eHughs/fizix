import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store", ...extraHeaders },
  });
}

function getLegacyOrNewSecret() {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed.default ?? Object.values(parsed)[0] ?? null;
  } catch { return null; }
}

function getLegacyOrNewPublishable() {
  const legacy = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacy) return legacy;
  const raw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed.default ?? Object.values(parsed)[0] ?? null;
  } catch { return null; }
}

async function hmacSha256(value: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function requestIp(req: Request) {
  const cfIp = req.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function isDuplicateUserError(message: string) {
  const value = message.toLowerCase();
  return value.includes("already") || value.includes("registered") || value.includes("exists");
}

async function findUserByEmail(adminClient: ReturnType<typeof createClient>, email: string) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.trim().toLowerCase() === email);
    if (match) return match;
    if (data.users.length < 1000) break;
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const secretKey = getLegacyOrNewSecret();
  const publishableKey = getLegacyOrNewPublishable();
  if (!supabaseUrl || !secretKey || !publishableKey) return json({ error: "Signup service is temporarily unavailable." }, 503);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Invalid signup request." }, 400); }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) return json({ error: "Enter a valid email address." }, 400);
  if (password.length < 8 || password.length > 128) return json({ error: "Password must be 8–128 characters." }, 400);

  const adminClient = createClient(supabaseUrl, secretKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const publicClient = createClient(supabaseUrl, publishableKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });

  try {
    const ipHash = await hmacSha256(requestIp(req), secretKey);
    const now = Date.now();
    const [{ count: minuteCount, error: minuteError }, { count: hourCount, error: hourError }] = await Promise.all([
      adminClient.from("signup_rate_limits").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", new Date(now - 60_000).toISOString()),
      adminClient.from("signup_rate_limits").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", new Date(now - 3_600_000).toISOString()),
    ]);
    if (minuteError || hourError) throw minuteError ?? hourError;
    if ((minuteCount ?? 0) >= 5 || (hourCount ?? 0) >= 20) {
      return json({ error: "Too many signup attempts from this connection. Please wait a little and try again." }, 429, { "Retry-After": (minuteCount ?? 0) >= 5 ? "60" : "3600" });
    }

    const { error: attemptError } = await adminClient.from("signup_rate_limits").insert({ ip_hash: ipHash });
    if (attemptError) throw attemptError;
    void adminClient.from("signup_rate_limits").delete().lt("created_at", new Date(now - 86_400_000).toISOString());

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { signup_source: "public" },
    });
    if (!createError && created.user) return json({ ok: true, userId: created.user.id, recovered: false }, 201);

    const createMessage = createError?.message ?? "Unable to create account.";
    if (!isDuplicateUserError(createMessage)) return json({ error: createMessage }, 400);

    const { error: signInError } = await publicClient.auth.signInWithPassword({ email, password });
    const signInMessage = signInError?.message.toLowerCase() ?? "";
    const signInCode = String((signInError as { code?: string } | null)?.code ?? "").toLowerCase();
    if (signInError && (signInCode === "email_not_confirmed" || signInMessage.includes("email not confirmed"))) {
      const stuckUser = await findUserByEmail(adminClient, email);
      if (!stuckUser) return json({ error: "Account exists but could not be recovered. Please contact support." }, 409);
      const { error: confirmError } = await adminClient.auth.admin.updateUserById(stuckUser.id, { email_confirm: true });
      if (confirmError) throw confirmError;
      return json({ ok: true, userId: stuckUser.id, recovered: true });
    }

    return json({ error: "An account with this email already exists. Sign in instead." }, 409);
  } catch (error) {
    console.error("public-signup failed", error);
    return json({ error: "Unable to create your account right now. Please try again shortly." }, 500);
  }
});
