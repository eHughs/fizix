"use client";

import Link from "next/link";
import { ArrowRight, AlertTriangle, KeyRound, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const AUTH_HOST = "bekaoohyvuqrqezhcodj.supabase.co";

type ActionCopy = {
  eyebrow: string;
  title: string;
  description: string;
  button: string;
  icon: typeof ShieldCheck;
};

function actionCopy(type: string | null): ActionCopy {
  switch (type) {
    case "recovery":
      return { eyebrow: "Password recovery", title: "Reset your password", description: "Continue when you’re ready. Your one-time recovery link will only be used after you press the button below.", button: "Continue to password reset", icon: KeyRound };
    case "invite":
      return { eyebrow: "Account invitation", title: "Accept your invitation", description: "Continue to accept your Trader Analytics invitation and finish setting up your account.", button: "Accept invitation", icon: MailCheck };
    case "magiclink":
    case "magic_link":
      return { eyebrow: "Secure sign-in", title: "Sign in to Trader Analytics", description: "Continue to use your one-time sign-in link. It will not be consumed until you press the button.", button: "Continue to sign in", icon: ShieldCheck };
    case "email_change":
      return { eyebrow: "Account security", title: "Confirm your email change", description: "Continue to approve the requested email-address change for your account.", button: "Confirm email change", icon: MailCheck };
    default:
      return { eyebrow: "Account verification", title: "Confirm this account action", description: "Continue to securely confirm this Trader Analytics account action.", button: "Continue securely", icon: ShieldCheck };
  }
}

function validateTarget(raw: string) {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.hostname !== AUTH_HOST || url.pathname !== "/auth/v1/verify") return null;
    return url;
  } catch {
    return null;
  }
}

export default function AuthActionGate() {
  const [target, setTarget] = useState<URL | null>(null);
  const [ready, setReady] = useState(false);
  const [continuing, setContinuing] = useState(false);

  useEffect(() => {
    const raw = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    setTarget(raw ? validateTarget(raw) : null);
    setReady(true);
  }, []);

  const copy = useMemo(() => actionCopy(target?.searchParams.get("type") ?? null), [target]);
  const Icon = copy.icon;

  if (!ready) {
    return (
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950/80 p-8 text-center shadow-2xl shadow-black/25">
        <Loader2 className="mx-auto animate-spin text-amber-400" size={28} />
        <p className="mt-4 text-sm text-slate-400">Checking security link…</p>
      </div>
    );
  }

  if (!target) {
    return (
      <div className="w-full max-w-md rounded-3xl border border-rose-500/20 bg-slate-950/85 p-8 text-center shadow-2xl shadow-black/25">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-300"><AlertTriangle size={26} /></div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-rose-300">Invalid security link</p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.035em] text-white">This link is incomplete or invalid</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">For your security, Trader Analytics only continues verified account links from the connected Supabase project.</p>
        <Link href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-5 text-sm font-semibold text-slate-200 transition hover:border-amber-500/30 hover:text-amber-300">Return to sign in</Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-amber-500/20 bg-slate-950/85 p-8 shadow-2xl shadow-black/25">
      <div className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400"><Icon size={23} /></div>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-amber-400">{copy.eyebrow}</p>
      <h1 className="mt-2 text-2xl font-bold tracking-[-0.035em] text-white">{copy.title}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-400">{copy.description}</p>
      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs leading-5 text-slate-500">
        This extra confirmation step helps prevent automated email scanners from using one-time account links before you do.
      </div>
      <button
        type="button"
        disabled={continuing}
        onClick={() => {
          setContinuing(true);
          window.location.assign(target.toString());
        }}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-bold text-amber-950 transition hover:bg-amber-400 disabled:cursor-wait disabled:opacity-60"
      >
        {continuing ? <Loader2 size={17} className="animate-spin" /> : null}
        {copy.button}
        {!continuing ? <ArrowRight size={17} /> : null}
      </button>
    </div>
  );
}
