"use client";

import Link from "next/link";
import { ArrowRight, KeyRound, Loader2, Mail, ShieldCheck, UserPlus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup" | "forgot" | "update";

const copy: Record<AuthMode, { title: string; description: string; submit: string }> = {
  login: { title: "Welcome back", description: "Sign in to continue reviewing your trading performance.", submit: "Sign in" },
  signup: { title: "Create your account", description: "Start building a private record of your trading decisions and performance.", submit: "Create account" },
  forgot: { title: "Reset your password", description: "We’ll send a secure recovery link to your email address.", submit: "Send recovery link" },
  update: { title: "Choose a new password", description: "Set a new password for your Trader Analytics account.", submit: "Update password" },
};

async function readFunctionError(error: unknown) {
  if (typeof error === "object" && error !== null && "context" in error) {
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      try {
        const payload: unknown = await context.clone().json();
        if (typeof payload === "object" && payload !== null && "error" in payload) {
          const value = (payload as { error?: unknown }).error;
          if (typeof value === "string" && value.trim()) return value;
        }
      } catch {
        // Fall through to the normal function error.
      }
    }
  }
  return error instanceof Error ? error.message : "Request failed.";
}

function friendlyAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const lower = message.toLowerCase();
  if (lower.includes("email rate limit") || lower.includes("rate limit exceeded")) return "The email service is temporarily at its sending limit. Please wait a few minutes before requesting another email.";
  if (lower.includes("invalid login credentials")) return "Email or password is incorrect.";
  if (lower.includes("email not confirmed")) return "This account is still waiting for activation. Try creating it again with the same email and password to recover it.";
  if (lower.includes("already exists") || lower.includes("already registered")) return "An account with this email already exists. Sign in instead.";
  return message || "Something went wrong. Please try again.";
}

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const config = copy[mode];
  const needsEmail = mode !== "update";
  const needsPassword = mode === "login" || mode === "signup" || mode === "update";
  const needsConfirm = mode === "signup" || mode === "update";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (needsConfirm && password !== confirmPassword) return setError("Passwords do not match.");
    if (needsPassword && password.length < 8) return setError("Password must be at least 8 characters.");

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return setError("Supabase is not configured.");

    setLoading(true);
    try {
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        window.location.assign("/dashboard/");
        return;
      }

      if (mode === "signup") {
        const { error: signupError } = await supabase.functions.invoke("public-signup", { body: { email, password } });
        if (signupError) throw new Error(await readFunctionError(signupError));
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
        window.location.assign("/dashboard/");
        return;
      }

      if (mode === "forgot") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/update-password/` });
        if (authError) throw authError;
        setMessage("Recovery email sent. If it doesn’t arrive, wait a few minutes before requesting another one.");
      }

      if (mode === "update") {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        setMessage("Password updated successfully. You can return to the dashboard.");
      }
    } catch (caught) {
      setError(friendlyAuthError(caught));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl shadow-black/25 backdrop-blur sm:p-8">
      <div className="mb-7">
        <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
          {mode === "signup" ? <UserPlus size={20} /> : mode === "forgot" || mode === "update" ? <KeyRound size={20} /> : <ShieldCheck size={20} />}
        </div>
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-white">{config.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">{config.description}</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {needsEmail ? (
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Email</span>
            <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/80 px-3 focus-within:border-amber-500/45">
              <Mail size={17} className="text-slate-600" aria-hidden="true" />
              <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="h-12 min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600" />
            </div>
          </label>
        ) : null}

        {needsPassword ? (
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Password</span>
            <input required minLength={8} maxLength={128} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className="h-12 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-amber-500/45" />
          </label>
        ) : null}

        {needsConfirm ? (
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Confirm password</span>
            <input required minLength={8} maxLength={128} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your password" className="h-12 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-amber-500/45" />
          </label>
        ) : null}

        {error ? <p aria-live="polite" className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-300">{error}</p> : null}
        {message ? <p aria-live="polite" className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-3 text-sm text-amber-300">{message}</p> : null}

        <button type="submit" disabled={loading} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-bold text-amber-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? <Loader2 size={17} className="animate-spin" /> : null}{config.submit}{!loading ? <ArrowRight size={17} /> : null}
        </button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        {mode === "login" ? <><Link className="text-slate-400 hover:text-white" href="/forgot-password">Forgot password?</Link><Link className="font-semibold text-amber-400 hover:text-amber-300" href="/signup">Create account</Link></> : null}
        {mode === "signup" ? <Link className="text-slate-400 hover:text-white" href="/login">Already have an account? Sign in</Link> : null}
        {mode === "forgot" ? <Link className="text-slate-400 hover:text-white" href="/login">Back to sign in</Link> : null}
        {mode === "update" ? <Link className="font-semibold text-amber-400 hover:text-amber-300" href="/dashboard">Return to dashboard</Link> : null}
      </div>
    </div>
  );
}
