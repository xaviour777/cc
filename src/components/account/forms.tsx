"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, LogOut } from "lucide-react";
import { memberLogin, memberLogout, requestMemberLink, setMemberPassword } from "@/lib/member-actions";

function Card({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-line bg-paper p-8 md:p-10 w-full max-w-md mx-auto">
      <h1 className="font-display font-extrabold text-2xl tracking-tight">{title}</h1>
      <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">{sub}</p>
      <div className="space-y-3 mt-7">{children}</div>
    </div>
  );
}

export function MemberLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await memberLogin(email, password);
      if (!res.ok) return setError(res.error ?? "Something went wrong");
      router.push("/account");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card title="Member sign in" sub="Your account is created once your first payment is verified. Check your email for the link to set a password.">
      <div>
        <label className="label">Email</label>
        <input className="field" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="label">Password</label>
        <input
          className="field"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </div>
      <button onClick={submit} disabled={busy} className="btn btn-primary w-full !py-3.5">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <>Sign in <ArrowRight size={16} /></>}
      </button>
      {error && <p className="text-sm font-medium text-center">{error}</p>}
      <p className="text-[13px] text-ink-soft text-center pt-2">
        First time, or forgot your password? <Link href="/account/forgot" className="u-link font-medium">Get a link</Link>
      </p>
    </Card>
  );
}

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <Card title="Get a password link" sub="Enter the email you booked with. If you're a member, we'll email you a link to set a new password.">
      {done ? (
        <p className="text-sm">
          If that email belongs to a member, a link is on its way. Didn&apos;t get it? Message us on WhatsApp and we&apos;ll send it there.
        </p>
      ) : (
        <>
          <div>
            <label className="label">Email</label>
            <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button
            disabled={busy || !email.includes("@")}
            onClick={async () => {
              setBusy(true);
              try {
                await requestMemberLink(email);
                setDone(true);
              } finally {
                setBusy(false);
              }
            }}
            className="btn btn-primary w-full !py-3.5"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : "Send link"}
          </button>
        </>
      )}
      <p className="text-[13px] text-ink-soft text-center pt-2">
        <Link href="/account/login" className="u-link font-medium">Back to sign in</Link>
      </p>
    </Card>
  );
}

export function SetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  return (
    <Card title="Set your password" sub="Choose a password for your Content Colony member account.">
      <div>
        <label className="label">New password (8+ characters)</label>
        <input className="field" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div>
        <label className="label">Type it again</label>
        <input className="field" type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
      </div>
      <button
        disabled={busy}
        onClick={async () => {
          setError(null);
          if (password !== again) return setError("The two passwords don't match.");
          setBusy(true);
          try {
            const res = await setMemberPassword(token, password);
            if (!res.ok) return setError(res.error ?? "Something went wrong");
            router.push("/account");
            router.refresh();
          } finally {
            setBusy(false);
          }
        }}
        className="btn btn-primary w-full !py-3.5"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : "Save and sign in"}
      </button>
      {error && <p className="text-sm font-medium text-center">{error}</p>}
    </Card>
  );
}

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await memberLogout();
        router.push("/");
        router.refresh();
      }}
      className="btn btn-outline !py-2.5 !px-5 text-sm"
    >
      <LogOut size={15} /> Sign out
    </button>
  );
}
