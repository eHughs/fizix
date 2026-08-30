"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  MailCheck,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const DEVELOPER_ID = "8d8c87ad-432e-4997-8413-5adae8d12e21";
const DEVELOPER_EMAIL = "evanrhughs@gmail.com";

type ManagedUser = {
  id: string;
  email: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
  isAnonymous: boolean;
  providers: string[];
};

type Metrics = {
  total: number;
  confirmed: number;
  unconfirmed: number;
  anonymous: number;
  created24h: number;
  created7d: number;
  signedIn7d: number;
};

type Overview = {
  developer: { id: string; email: string | null };
  metrics: Metrics;
  users: ManagedUser[];
};

type AdminResponse = {
  ok?: boolean;
  error?: string;
  user?: ManagedUser;
  userId?: string;
  email?: string;
};

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function relativeDate(value: string | null) {
  if (!value) return "Never signed in";
  const delta = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

export default function DeveloperConsole() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ManagedUser | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [workingAction, setWorkingAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const invoke = useCallback(async <T,>(body: Record<string, unknown>): Promise<T> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error("Supabase is not configured.");
    const { data, error } = await supabase.functions.invoke<T>("developer-admin", { body });
    if (error) throw error;
    const maybeError = (data as { error?: string } | null)?.error;
    if (maybeError) throw new Error(maybeError);
    if (!data) throw new Error("No response from developer service.");
    return data;
  }, []);

  const loadOverview = useCallback(async (manual = false) => {
    manual ? setRefreshing(true) : setLoading(true);
    setNotice(null);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase is not configured.");
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) throw new Error("You must be signed in.");
      if (data.user.id !== DEVELOPER_ID || data.user.email?.toLowerCase() !== DEVELOPER_EMAIL) {
        setAccessDenied(true);
        return;
      }
      const dataOverview = await invoke<Overview>({ action: "overview" });
      setOverview(dataOverview);
      setAccessDenied(false);
      if (selected) {
        const refreshed = dataOverview.users.find((user) => user.id === selected.id) ?? null;
        setSelected(refreshed);
        if (refreshed) setNewEmail(refreshed.email ?? "");
      }
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Unable to load developer console." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [invoke, selected]);

  useEffect(() => {
    void loadOverview(false);
    // Only load once when the protected console mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = useMemo(() => {
    if (!overview) return [];
    const query = search.trim().toLowerCase();
    if (!query) return overview.users;
    return overview.users.filter((user) =>
      user.email?.toLowerCase().includes(query) || user.id.toLowerCase().includes(query) || user.providers.some((provider) => provider.includes(query)),
    );
  }, [overview, search]);

  function openUser(user: ManagedUser) {
    setSelected(user);
    setNewEmail(user.email ?? "");
    setConfirmEmail(false);
    setNewPassword("");
    setShowPassword(false);
    setNotice(null);
  }

  async function runAction(action: string, body: Record<string, unknown>, success: string) {
    setWorkingAction(action);
    setNotice(null);
    try {
      await invoke<AdminResponse>({ action, ...body });
      setNotice({ kind: "success", text: success });
      setNewPassword("");
      await loadOverview(true);
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Admin operation failed." });
    } finally {
      setWorkingAction(null);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[55vh] place-items-center">
        <div className="text-center text-slate-400">
          <Loader2 className="mx-auto mb-3 animate-spin text-amber-400" size={26} />
          <p className="text-sm">Verifying developer access…</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-rose-500/25 bg-rose-500/10 p-8 text-center">
        <ShieldCheck className="mx-auto mb-4 text-rose-400" size={30} />
        <h1 className="text-xl font-bold text-slate-100">Developer access denied</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">This console is restricted to the approved developer account.</p>
      </div>
    );
  }

  const metrics = overview?.metrics;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-amber-500/20 bg-slate-950/70 shadow-xl shadow-black/10">
        <div className="border-b border-slate-800 bg-gradient-to-r from-amber-500/[0.10] via-transparent to-transparent p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400">
                <ShieldCheck size={14} /> Private developer console
              </div>
              <h1 className="text-2xl font-bold tracking-[-0.035em] text-slate-50 sm:text-3xl">Account administration</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Review account activity, manage email addresses, replace passwords, and send account recovery messages.
              </p>
              <p className="mt-3 text-xs text-slate-500">Authorized account: {DEVELOPER_EMAIL}</p>
            </div>
            <button
              type="button"
              disabled={refreshing}
              onClick={() => void loadOverview(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 text-sm font-semibold text-slate-300 transition hover:border-amber-500/25 hover:text-amber-400 disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        {metrics ? (
          <div className="grid gap-px bg-slate-800 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total accounts", value: metrics.total, detail: `${metrics.created7d} created in 7 days`, icon: Users },
              { label: "Confirmed", value: metrics.confirmed, detail: `${metrics.unconfirmed} awaiting confirmation`, icon: MailCheck },
              { label: "Active in 7 days", value: metrics.signedIn7d, detail: `${metrics.created24h} created in 24 hours`, icon: Clock3 },
              { label: "Anonymous", value: metrics.anonymous, detail: metrics.anonymous ? "Anonymous users detected" : "No anonymous accounts", icon: UserCog },
            ].map((item) => (
              <div key={item.label} className="bg-slate-950/95 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
                  <item.icon size={17} className="text-amber-400" />
                </div>
                <p className="text-3xl font-bold tracking-[-0.04em] text-slate-50">{item.value}</p>
                <p className="mt-1.5 text-xs text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl shadow-black/10 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100">User directory</h2>
            <p className="mt-1 text-sm text-slate-500">{filteredUsers.length} account{filteredUsers.length === 1 ? "" : "s"} shown</p>
          </div>
          <label className="relative block w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search email, ID, provider…"
              className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-amber-500/35"
            />
          </label>
        </div>

        {notice ? (
          <div className={`mt-5 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${notice.kind === "success" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-rose-500/25 bg-rose-500/10 text-rose-300"}`}>
            {notice.kind === "success" ? <CheckCircle2 size={17} className="mt-0.5 shrink-0" /> : <AlertTriangle size={17} className="mt-0.5 shrink-0" />}
            <span>{notice.text}</span>
          </div>
        ) : null}

        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-800">
          <table className="min-w-[880px] w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Account</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold">Last sign in</th>
                <th className="px-4 py-3 font-semibold">Provider</th>
                <th className="px-4 py-3 text-right font-semibold">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="bg-slate-950/40 transition hover:bg-slate-900/55">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-200">{user.email ?? "No email"}</p>
                    <p className="mt-1 font-mono text-[11px] text-slate-600">{user.id}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${user.emailConfirmedAt ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-amber-500/20 bg-amber-500/10 text-amber-400"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${user.emailConfirmedAt ? "bg-emerald-400" : "bg-amber-400"}`} />
                      {user.emailConfirmedAt ? "Confirmed" : "Unconfirmed"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-400">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-4">
                    <p className="text-slate-300">{relativeDate(user.lastSignInAt)}</p>
                    {user.lastSignInAt ? <p className="mt-1 text-[11px] text-slate-600">{formatDate(user.lastSignInAt)}</p> : null}
                  </td>
                  <td className="px-4 py-4 text-slate-400">{user.providers.join(", ") || "Email"}</td>
                  <td className="px-4 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => openUser(user)}
                      className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-amber-500/30 hover:text-amber-400"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredUsers.length ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">No matching accounts.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {selected ? (
        <div className="fixed inset-0 z-[80] flex justify-end bg-slate-950/65 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Manage account">
          <button className="absolute inset-0 cursor-default" aria-label="Close account panel" onClick={() => setSelected(null)} />
          <aside className="relative z-10 h-full w-full max-w-xl overflow-y-auto border-l border-slate-800 bg-slate-950 p-5 shadow-2xl shadow-black/30 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-400">Account management</p>
                <h2 className="mt-2 break-all text-xl font-bold text-slate-100">{selected.email ?? "No email"}</h2>
                <p className="mt-1 break-all font-mono text-[11px] text-slate-600">{selected.id}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-800 text-slate-400 hover:text-slate-100" aria-label="Close">
                <X size={17} />
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
                <p className="text-xs text-slate-500">Created</p>
                <p className="mt-2 text-sm font-semibold text-slate-200">{formatDate(selected.createdAt)}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
                <p className="text-xs text-slate-500">Last sign in</p>
                <p className="mt-2 text-sm font-semibold text-slate-200">{formatDate(selected.lastSignInAt)}</p>
              </div>
            </div>

            <section className="mt-6 rounded-2xl border border-slate-800 p-4">
              <div className="flex items-center gap-2">
                <MailCheck size={18} className="text-amber-400" />
                <h3 className="font-bold text-slate-100">Email address</h3>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">Change the login email immediately. Optionally mark the new address as confirmed.</p>
              <input
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                className="mt-4 h-11 w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 text-sm text-slate-100 outline-none focus:border-amber-500/35"
              />
              <label className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <input type="checkbox" checked={confirmEmail} onChange={(event) => setConfirmEmail(event.target.checked)} className="accent-amber-500" />
                Mark new email as confirmed
              </label>
              <button
                type="button"
                disabled={workingAction !== null || !newEmail.trim() || newEmail.trim().toLowerCase() === selected.email?.toLowerCase()}
                onClick={() => void runAction("update_email", { userId: selected.id, email: newEmail, confirm: confirmEmail }, "Email address updated.")}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-bold text-amber-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {workingAction === "update_email" ? <Loader2 size={16} className="animate-spin" /> : <MailCheck size={16} />} Update email
              </button>
            </section>

            <section className="mt-4 rounded-2xl border border-slate-800 p-4">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-amber-400" />
                <h3 className="font-bold text-slate-100">Password</h3>
              </div>
              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/55 p-3 text-xs leading-5 text-slate-500">
                Existing passwords cannot be displayed. Supabase stores password hashes rather than retrievable plaintext passwords. You can safely replace the password below.
              </div>
              <div className="relative mt-4">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="New password (8–128 characters)"
                  autoComplete="new-password"
                  className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 pr-11 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-500/35"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:text-slate-200" aria-label={showPassword ? "Hide new password" : "Show new password"}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button
                type="button"
                disabled={workingAction !== null || newPassword.length < 8 || newPassword.length > 128}
                onClick={() => void runAction("set_password", { userId: selected.id, password: newPassword }, "Password replaced successfully.")}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 text-sm font-bold text-amber-400 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {workingAction === "set_password" ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />} Set new password
              </button>
            </section>

            <section className="mt-4 rounded-2xl border border-slate-800 p-4">
              <h3 className="font-bold text-slate-100">Account emails</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">Send secure self-service emails to the account’s current address.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={workingAction !== null || !selected.email}
                  onClick={() => void runAction("send_reset", { userId: selected.id, redirectOrigin: window.location.origin }, `Password reset email sent to ${selected.email}.`)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm font-semibold text-slate-300 transition hover:border-amber-500/25 hover:text-amber-400 disabled:opacity-45"
                >
                  {workingAction === "send_reset" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send password reset
                </button>
                <button
                  type="button"
                  disabled={workingAction !== null || !selected.email || Boolean(selected.emailConfirmedAt)}
                  onClick={() => void runAction("resend_verification", { userId: selected.id, redirectOrigin: window.location.origin }, `Verification email sent to ${selected.email}.`)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm font-semibold text-slate-300 transition hover:border-amber-500/25 hover:text-amber-400 disabled:opacity-45"
                >
                  {workingAction === "resend_verification" ? <Loader2 size={16} className="animate-spin" /> : <MailCheck size={16} />} Resend verification
                </button>
              </div>
            </section>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
