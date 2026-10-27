"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { adminLogin } from "@/app/admin/actions";
import { ColonyMark } from "@/components/ui/icons";

export default function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [needsMfa, setNeedsMfa] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await adminLogin({ email, password, mfaCode: mfaCode || undefined });
      if (res.requiresMfa) {
        setNeedsMfa(true);
        setError(res.error ?? null);
        return;
      }
      if (!res.ok) {
        setError(res.error ?? "Something went wrong");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl border border-line bg-paper p-8 md:p-10 w-full max-w-md shadow-[0_40px_80px_-40px_rgba(0,0,0,0.25)]">
      <ColonyMark className="w-10 h-10" />
      <h1 className="font-display font-extrabold text-2xl tracking-tight mt-6">Colony admin</h1>
      <p className="text-sm text-ink-soft mt-1.5">
        Sign in to run the house.{" "}
        <span className="inline-flex items-center gap-1 font-medium"><ShieldCheck size={13} /> MFA enforced where enabled.</span>
      </p>
      <div className="space-y-3 mt-7">
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
        {needsMfa && (
          <div>
            <label className="label">Authenticator code</label>
            <input
              className="field font-mono tracking-[0.3em]"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
        )}
        <button onClick={submit} disabled={busy} className="btn btn-primary w-full !py-3.5">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <>Sign in <ArrowRight size={15} /></>}
        </button>
        {error && !needsMfa && <p className="text-sm text-center font-medium">{error}</p>}
        {needsMfa && <p className="text-xs text-center text-ink-soft">Enter the 6-digit code from your authenticator app.</p>}
      </div>
    </div>
  );
}
