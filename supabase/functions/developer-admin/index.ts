import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.4";

const ADMIN_USER_ID = "8d8c87ad-432e-4997-8413-5adae8d12e21";
const ADMIN_EMAIL = "evanrhughs@gmail.com";
const MAX_USERS = 10000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
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
  } catch {
    return null;
  }
}

function getLegacyOrNewPublishable() {
  const legacy = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacy) return legacy;
  const raw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed.default ?? Object.values(parsed)[0] ?? null;
  } catch {
    return null;
  }
}

async function requireDeveloper(req: Request, supabaseUrl: string, publishableKey: string) {
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const authClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await authClient.auth.getUser();
  if (error || !data.user) return null;

  const email = data.user.email?.trim().toLowerCase() ?? "";
  if (data.user.id !== ADMIN_USER_ID || email !== ADMIN_EMAIL) return null;
  return data.user;
}

function safeUser(user: Record<string, unknown> & {
  id: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  is_anonymous?: boolean;
  identities?: Array<{ provider?: string }>;
}) {
  return {
    id: user.id,
    email: user.email ?? null,
    createdAt: user.created_at ?? null,
    updatedAt: user.updated_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
    emailConfirmedAt: user.email_confirmed_at ?? null,
    isAnonymous: Boolean(user.is_anonymous),
    providers: Array.isArray(user.identities)
      ? user.identities.map((identity) => identity.provider).filter((provider): provider is string => Boolean(provider))
      : [],
  };
}

async function loadAllUsers(adminClient: ReturnType<typeof createClient>) {
  const users = [];
  for (let page = 1; page <= 10 && users.length < MAX_USERS; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return users.slice(0, MAX_USERS);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const secretKey = getLegacyOrNewSecret();
  const publishableKey = getLegacyOrNewPublishable();
  if (!supabaseUrl || !secretKey || !publishableKey) return json({ error: "Server configuration unavailable" }, 500);

  const developer = await requireDeveloper(req, supabaseUrl, publishableKey);
  if (!developer) return json({ error: "Developer access denied" }, 403);

  const adminClient = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const publicClient = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const action = String(body.action ?? "overview");

  try {
    if (action === "overview") {
      const users = await loadAllUsers(adminClient);
      const now = Date.now();
      const day = 86_400_000;
      const confirmed = users.filter((user) => Boolean(user.email_confirmed_at)).length;
      const anonymous = users.filter((user) => Boolean(user.is_anonymous)).length;
      const created24h = users.filter((user) => now - new Date(user.created_at).getTime() <= day).length;
      const created7d = users.filter((user) => now - new Date(user.created_at).getTime() <= 7 * day).length;
      const signedIn7d = users.filter((user) => user.last_sign_in_at && now - new Date(user.last_sign_in_at).getTime() <= 7 * day).length;

      users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return json({
        developer: { id: developer.id, email: developer.email },
        metrics: {
          total: users.length,
          confirmed,
          unconfirmed: users.length - confirmed,
          anonymous,
          created24h,
          created7d,
          signedIn7d,
        },
        users: users.map((user) => safeUser(user)),
      });
    }

    const userId = String(body.userId ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(userId)) return json({ error: "Valid user ID required" }, 400);

    if (action === "update_email") {
      const email = String(body.email ?? "").trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 320) return json({ error: "Valid email required" }, 400);
      const confirm = body.confirm === true;
      const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
        email,
        ...(confirm ? { email_confirm: true } : {}),
      });
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

    const redirectOriginRaw = String(body.redirectOrigin ?? "");
    let redirectOrigin = "";
    try {
      const parsed = new URL(redirectOriginRaw);
      if (parsed.protocol === "https:" || parsed.hostname === "localhost") redirectOrigin = parsed.origin;
    } catch {
      redirectOrigin = "";
    }
    const updatePasswordUrl = redirectOrigin ? `${redirectOrigin}/update-password/` : undefined;
    const dashboardUrl = redirectOrigin ? `${redirectOrigin}/dashboard/` : undefined;

    if (action === "send_reset") {
      const { error } = await publicClient.auth.resetPasswordForEmail(targetEmail, updatePasswordUrl ? { redirectTo: updatePasswordUrl } : undefined);
      if (error) throw error;
      return json({ ok: true, email: targetEmail });
    }

    if (action === "resend_verification") {
      const { error } = await publicClient.auth.resend({
        type: "signup",
        email: targetEmail,
        ...(dashboardUrl ? { options: { emailRedirectTo: dashboardUrl } } : {}),
      });
      if (error) throw error;
      return json({ ok: true, email: targetEmail });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin operation failed";
    return json({ error: message }, 400);
  }
});
