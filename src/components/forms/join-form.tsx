"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { joinColony } from "@/lib/actions";

export default function JoinForm({ dark = false }: { dark?: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState("Staying at the Colony");
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await joinColony({ name, email, interest, honeypot });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  if (done)
    return (
      <div className="flex items-center justify-center gap-3 py-6">
        <span className="w-10 h-10 rounded-full border border-current/30 flex items-center justify-center">
          <Check size={18} />
        </span>
        <p className="font-display font-bold text-xl">You&apos;re on the list. See you soon.</p>
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className={`grid sm:grid-cols-[1fr_1fr_auto] gap-3 ${dark ? "" : ""}`}>
        <input
          className={`field ${dark ? "!bg-transparent !border-paper/30 !text-paper placeholder:!text-paper/50" : ""}`}
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={`field ${dark ? "!bg-transparent !border-paper/30 !text-paper placeholder:!text-paper/50" : ""}`}
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select
          className={`field ${dark ? "!bg-transparent !border-paper/30 !text-paper [&>option]:text-black" : ""}`}
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
        >
          {["Staying at the Colony", "Workshops & events", "Hosting an event", "Just curious"].map((i) => (
            <option key={i}>{i}</option>
          ))}
        </select>
      </div>
      <input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="hidden" tabIndex={-1} aria-hidden />
      <button
        onClick={submit}
        disabled={busy}
        className={`btn w-full mt-3 !py-4 ${dark ? "bg-paper text-ink hover:opacity-90" : "btn-primary"}`}
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <>Join the Colony <ArrowRight size={16} /></>}
      </button>
      {error && <p className="text-sm text-center mt-3 font-medium">{error}</p>}
    </div>
  );
}
