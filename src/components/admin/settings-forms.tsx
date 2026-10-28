"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2, Save, ShieldCheck } from "lucide-react";
import { changePassword, mfaEnable, mfaStart, updateRatePlan, updateSettings } from "@/app/admin/actions";
import type { RatePlan } from "@/db/schema";

export function SiteSettingsForm({ initial }: { initial: Record<string, string | number> }) {
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const set = (k: string, v: string | number) => setF((p) => ({ ...p, [k]: v }));

  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <p className="font-semibold text-sm">Site & contact</p>
      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        <div>
          <label className="label">Contact email</label>
          <input className="field" value={String(f.contactEmail ?? "")} onChange={(e) => set("contactEmail", e.target.value)} />
        </div>
        <div>
          <label className="label">WhatsApp number (e.g. 92300…)</label>
          <input className="field" value={String(f.whatsappNumber ?? "")} onChange={(e) => set("whatsappNumber", e.target.value)} />
        </div>
        <div>
          <label className="label">Prices on website</label>
          <select className="field" value={String(f.hidePrices ?? "no")} onChange={(e) => set("hidePrices", e.target.value)}>
            <option value="no">Show prices, normal booking</option>
            <option value="yes">Hide prices, pre-booking request + WhatsApp</option>
          </select>
        </div>
        <div>
          <label className="label">Minimum stay (nights)</label>
          <input type="number" min={1} className="field" value={String(f.minStayNights ?? 3)} onChange={(e) => set("minStayNights", Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Default resident discount (%)</label>
          <input type="number" min={0} max={100} className="field" value={String(f.residentDiscountPct ?? 25)} onChange={(e) => set("residentDiscountPct", Number(e.target.value))} />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        {(["instagram", "tiktok", "youtube", "facebook", "linkedin"] as const).map((k) => (
          <div key={k}>
            <label className="label">{k} handle</label>
            <input className="field" value={String(f[k] ?? "")} onChange={(e) => set(k, e.target.value)} placeholder="without @" />
          </div>
        ))}
      </div>
      <div className="mt-3">
        <label className="label">Footer legal note</label>
        <textarea className="field min-h-20" value={String(f.legalNotice ?? "")} onChange={(e) => set("legalNotice", e.target.value)} />
      </div>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await updateSettings(f);
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
            router.refresh();
          } finally {
            setBusy(false);
          }
        }}
        className="btn btn-primary !py-2.5 !px-6 text-sm mt-4"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {saved ? "Saved" : "Save settings"}
      </button>
    </div>
  );
}

export function RatePlanEditor({ plans, types }: { plans: RatePlan[]; types: { id: number; name: string }[] }) {
  const [state, setState] = useState(plans);
  const [busyId, setBusyId] = useState<number | null>(null);
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <p className="font-semibold text-sm">Prices & packages</p>
      <p className="text-[12px] text-ink-soft mt-1">
        Package bundles (7/30 nights) are charged as fixed packages — never the nightly rate multiplied.
      </p>
      <div className="mt-4 space-y-2.5">
        {state.map((p) => (
          <div key={p.id} className="grid grid-cols-[1fr_120px_110px_110px] sm:grid-cols-[1fr_140px_120px_120px] gap-2 items-center rounded-xl bg-mist px-4 py-3">
            <div>
              <p className="text-sm font-medium">{types.find((t) => t.id === p.accommodationTypeId)?.name}</p>
              <p className="text-[11.5px] text-ink-soft">{p.name} · unit of {p.unitNights} night{p.unitNights > 1 ? "s" : ""}</p>
            </div>
            <div>
              <label className="label !mb-1">Price PKR</label>
              <input
                type="number"
                className="field !py-2 text-sm"
                value={p.pricePkr}
                onChange={(e) =>
                  setState((s) => s.map((x) => (x.id === p.id ? { ...x, pricePkr: Number(e.target.value) } : x)))
                }
              />
            </div>
            <div>
              <label className="label !mb-1">Min nights</label>
              <input
                type="number"
                className="field !py-2 text-sm"
                value={p.minBookingNights}
                onChange={(e) =>
                  setState((s) => s.map((x) => (x.id === p.id ? { ...x, minBookingNights: Number(e.target.value) } : x)))
                }
              />
            </div>
            <div className="flex items-center gap-2 pt-4">
              <label className="text-[12px] flex items-center gap-1.5">
                <input
                  type="checkbox"
                  className="accent-black"
                  checked={p.active}
                  onChange={(e) =>
                    setState((s) => s.map((x) => (x.id === p.id ? { ...x, active: e.target.checked } : x)))
                  }
                />
                On
              </label>
              <button
                disabled={busyId === p.id}
                onClick={async () => {
                  setBusyId(p.id);
                  try {
                    await updateRatePlan(p.id, p.pricePkr, p.minBookingNights, p.active);
                    router.refresh();
                  } finally {
                    setBusyId(null);
                  }
                }}
                className="btn btn-primary !py-2 !px-3.5 text-[12px]"
              >
                {busyId === p.id ? <Loader2 size={12} className="animate-spin" /> : "Save"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SecurityPanel({ mfaEnabled, email }: { mfaEnabled: boolean; email: string }) {
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pw, setPw] = useState({ current: "", next: "" });
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <p className="font-semibold text-sm flex items-center gap-2"><ShieldCheck size={15} /> Admin security</p>

      <div className="mt-4">
        <p className="text-[13px] font-medium">Multi-factor authentication (TOTP authenticator app)</p>
        <p className="text-[12px] text-ink-soft mt-0.5">Status: {mfaEnabled ? "Enabled" : "Not enabled"}</p>
        {!mfaEnabled && !secret && (
          <button
            className="btn btn-outline !py-2 !px-4 text-[12.5px] mt-3"
            onClick={async () => {
              const res = await mfaStart();
              if (res.ok && res.secret) setSecret(res.secret);
            }}
          >
            Set up MFA
          </button>
        )}
        {secret && (
          <div className="mt-3 rounded-xl bg-mist p-4 space-y-2">
            <p className="text-[12.5px]">1. Add this to your authenticator app (Google Authenticator, 1Password…):</p>
            <p className="font-mono text-[12px] break-all bg-paper rounded-lg px-3 py-2 border border-line flex items-center justify-between gap-2">
              {secret}
              <button onClick={() => navigator.clipboard.writeText(secret)} className="shrink-0" aria-label="Copy secret"><Copy size={13} /></button>
            </p>
            <p className="text-[11.5px] text-ink-soft break-all">otpauth://totp/ContentColony:{email}?secret={secret}&issuer=ContentColony</p>
            <div className="flex gap-2 pt-1">
              <input className="field !py-2 font-mono" placeholder="6-digit code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
              <button
                className="btn btn-primary !py-2 !px-4 text-[12.5px]"
                onClick={async () => {
                  const res = await mfaEnable(code);
                  setMsg(res.ok ? "MFA enabled. You'll be asked for a code at every login." : res.error ?? "Wrong code");
                  if (res.ok) router.refresh();
                }}
              >
                Verify & enable
              </button>
            </div>
            {msg && <p className="text-[12.5px] font-medium">{msg}</p>}
          </div>
        )}
      </div>

      <div className="mt-6 pt-5 border-t border-line">
        <p className="text-[13px] font-medium">Change password</p>
        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 mt-3">
          <input type="password" className="field !py-2.5" placeholder="Current password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          <input type="password" className="field !py-2.5" placeholder="New password (10+ chars)" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          <button
            className="btn btn-primary !py-2.5 !px-5 text-sm"
            onClick={async () => {
              const res = await changePassword(pw.current, pw.next);
              setPwMsg(res.ok ? "Password updated." : res.error ?? "Failed");
              if (res.ok) setPw({ current: "", next: "" });
            }}
          >
            Update
          </button>
        </div>
        {pwMsg && <p className="text-[12.5px] font-medium mt-2">{pwMsg}</p>}
      </div>
    </div>
  );
}
