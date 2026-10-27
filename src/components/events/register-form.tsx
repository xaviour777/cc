"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { registerForEvent } from "@/lib/actions";
import { pkr } from "@/lib/utils";

export default function EventRegisterForm({
  eventSlug,
  ticketPkr,
  discountPct,
}: {
  eventSlug: string;
  ticketPkr: number;
  discountPct: number;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ amountDue: number; discountPct: number; free: boolean } | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await registerForEvent({
        eventSlug,
        name,
        email,
        phone,
        bookingReference: reference,
        honeypot,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone(res);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl bg-mist border border-line p-6 text-center">
        <div className="mx-auto w-11 h-11 rounded-full bg-ink text-paper flex items-center justify-center">
          <Check size={18} />
        </div>
        <p className="font-display font-bold text-xl mt-4">Seat saved.</p>
        <p className="text-sm text-ink-soft mt-2 leading-relaxed">
          {done.free
            ? "You're confirmed — free community entry. See you there."
            : `${pkr(done.amountDue)} ${done.discountPct > 0 ? `(resident ${done.discountPct}% off applied)` : ""} — payment details land in your inbox, and we confirm your seat when payment arrives.`}
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-primary w-full !py-4">
        {ticketPkr > 0 ? `Save my seat · ${pkr(ticketPkr)}` : "Save my seat — free entry"}
        <ArrowRight size={16} />
      </button>
    );
  }

  return (
    <div className="rounded-2xl bg-mist border border-line p-5 space-y-3">
      <p className="font-semibold text-sm">Save your seat</p>
      <input className="field !bg-paper" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="field !bg-paper" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="field !bg-paper" placeholder="WhatsApp number" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <div>
        <input
          className="field !bg-paper"
          placeholder="Resident? Booking reference (e.g. CC-2501-ABCDE)"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
        <p className="text-[11.5px] text-ink-soft mt-1.5 flex items-center gap-1">
          <Sparkles size={11} /> Residents get {discountPct}% off — verified against your stay.
        </p>
      </div>
      <input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="hidden" tabIndex={-1} aria-hidden />
      <button onClick={submit} disabled={busy} className="btn btn-primary w-full">
        {busy ? <Loader2 size={16} className="animate-spin" /> : "Register"} 
        {!busy && <ArrowRight size={15} />}
      </button>
      {error && <p className="text-[13px] font-medium">{error}</p>}
      <button onClick={() => setOpen(false)} className="text-xs text-ink-soft underline mx-auto block">
        Not yet
      </button>
    </div>
  );
}
