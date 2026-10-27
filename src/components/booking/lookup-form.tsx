"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

export default function BookingLookupForm() {
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  const go = () => {
    if (!reference.trim() || !email.trim()) return;
    start(() =>
      router.push(`/booking/${encodeURIComponent(reference.trim().toUpperCase())}?email=${encodeURIComponent(email.trim())}`)
    );
  };

  return (
    <div className="rounded-3xl border border-line bg-paper p-8 md:p-10 max-w-md mx-auto">
      <h1 className="display-md">Open your booking.</h1>
      <p className="text-ink-soft text-sm mt-2 leading-relaxed">
        Your reference arrived after you requested a booking — it looks like
        <span className="font-mono"> CC-2501-ABCDE</span>.
      </p>
      <div className="space-y-3 mt-6">
        <div>
          <label className="label">Booking reference</label>
          <input className="field font-mono" placeholder="CC-____-_____" value={reference} onChange={(e) => setReference(e.target.value)} />
        </div>
        <div>
          <label className="label">Email used at booking</label>
          <input
            className="field"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
          />
        </div>
        <button onClick={go} disabled={pending} className="btn btn-primary w-full !py-4">
          {pending ? <Loader2 size={16} className="animate-spin" /> : <>Open the portal <ArrowRight size={16} /></>}
        </button>
      </div>
    </div>
  );
}
