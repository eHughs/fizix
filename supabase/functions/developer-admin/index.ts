import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type User } from "npm:@supabase/supabase-js@2.112.4";

const ADMIN_USER_ID = "8d8c87ad-432e-4997-8413-5adae8d12e21";
const ADMIN_EMAIL = "evanrhughs@gmail.com";
const MAX_USERS = 10000;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

function envKey(legacyName: string, modernName: string) {
  const legacy = Deno.env.get(legacyName);
  if (legacy) return legacy;
  const raw = Deno.env.get(modernName);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed.default ?? Object.values(parsed)[0] ?? null;
  } catch { return null; }
}

function safeUser(user: User) {
  return {
    id: user.id,
    email: user.email ?? null,
    createdAt: user.created_at ?? null,
    updatedAt: user.updated_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
    emailConfirmedAt: user.email_confirmed_at ?? null,
    isAnonymous: Boolean(user.is_anonymous),
    providers: Array.isArray(user.identities) ? user.identities.map((identity) => identity.provider).filter(Boolean) : [],
  };
}

async function loadAllUsers(adminClient: ReturnType<typeof createClient>) {
  const users: User[] = [];
  for (let page = 1; page <= 10 && users.length < MAX_USERS; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return users.slice(0, MAX_USERS);
}

function mailErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Admin operation failed";
  const lower = message.toLowerCase();
  if (lower.includes("email rate limit") || lower.includes("rate limit exceeded") || lower.includes("over_email_send_rate_limit")) {
    return json({ error: "Email service is temporarily at its sending limit. Try again in a few minutes.", code: "email_rate_limited" }, 429);
  }
  return json({ error: message }, 400);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const secretKey = envKey("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEYS");
  const publishableKey = envKey("SUPABASE_ANON_KEY", "SUPABASE_PUBLISHABLE_KEYS");
  if (!supabaseUrl || !secretKey || !publishableKey) return json({ error: "Server configuration unavailable" }, 500);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Developer access denied" }, 403);
  const authClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: callerData, error: callerError } = await authClient.auth.getUser();
  const developer = callerData.user;
  if (callerError || !developer || developer.id !== ADMIN_USER_ID || developer.email?.trim().toLowerCase() !== ADMIN_EMAIL) {
    return json({ error: "Developer access denied" }, 403);
  }

  const adminClient = createClient(supabaseUrl, secretKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const publicClient = createClient(supabaseUrl, publishableKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
  const action = String(body.action ?? "overview");

  try {
    if (action === "overview") {
      const users = await loadAllUsers(adminClient);
      const now = Date.now();
      const day = 86_400_000;
      const confirmed = users.filter((user) => Boolean(user.email_confirmed_at)).length;
      users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return json({ developer: { id: developer.id, email: developer.email }, metrics: {
        total: users.length,
        confirmed,
        unconfirmed: users.length - confirmed,
        anonymous: users.filter((user) => Boolean(user.is_anonymous)).length,
        created24h: users.filter((user) => now - new Date(user.created_at).getTime() <= day).length,
        created7d: users.filter((user) => now - new Date(user.created_at).getTime() <= 7 * day).length,
        signedIn7d: users.filter((user) => user.last_sign_in_at && now - new Date(user.last_sign_in_at).getTime() <= 7 * day).length,
      }, users: users.map(safeUser) });
    }

    const userId = String(body.userId ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(userId)) return json({ error: "Valid user ID required" }, 400);
    if (action === "update_email") {
      const email = String(body.email ?? "").trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 320) return json({ error: "Valid email required" }, 400);
      if (userId === ADMIN_USER_ID && email !== ADMIN_EMAIL) return json({ error: "The developer account email is locked because it controls developer-console access." }, 400);
      const { data, error } = await adminClient.auth.admin.updateUserById(userId, { email, ...(body.confirm === true ? { email_confirm: true } : {}) });
      if (error) throw error;
      return json({ ok: true, user: safeUser(data.user) });
    }
    if (action === "set_password") {
      const password = String(body.password ?? "");
      if (password.length < 8 || password.length > 128) return json({ error: "Password must be 8–128 characters" }, 400);
      const { data, error } = await adminClient.auth.admin.updateUserById(userId, { password });
      if (error) throw error;
      return json({ ok: true, userId: data.user.id });
    }

    const { data: target, error: targetError } = await adminClient.auth.admin.getUserById(userId);
    if (targetError || !target.user?.email) return json({ error: "User email not found" }, 404);
    const targetEmail = target.user.email;
    const rawOrigin = String(body.redirectOrigin ?? "");
    let origin = "";
    try {
      const parsed = new URL(rawOrigin);
      if (parsed.protocol === "https:" || parsed.hostname === "localhost") origin = parsed.origin;
    } catch { origin = ""; }

    if (action === "send_reset") {
      const { error } = await publicClient.auth.resetPasswordForEmail(targetEmail, origin ? { redirectTo: `${origin}/update-password/` } : undefined);
      if (error) throw error;
      return json({ ok: true, email: targetEmail });
    }
    if (action === "resend_verification") {
      const { error } = await publicClient.auth.resend({ type: "signup", email: targetEmail, ...(origin ? { options: { emailRedirectTo: `${origin}/dashboard/` } } : {}) });
      if (error) throw error;
      return json({ ok: true, email: targetEmail });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    return mailErrorResponse(error);
  }
});
