"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { submitContact } from "@/lib/actions";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", topic: "Staying with us", message: "" });
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await submitContact({ ...form, honeypot });
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
      <div className="rounded-3xl border border-line bg-mist p-10 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-ink text-paper flex items-center justify-center">
          <Check size={20} />
        </div>
        <p className="display-md mt-5">Message received.</p>
        <p className="text-ink-soft mt-2 text-sm max-w-sm mx-auto">
          We read everything ourselves — expect a reply on email or WhatsApp soon.
        </p>
      </div>
    );

  return (
    <div className="rounded-3xl border border-line bg-paper p-6 md:p-8 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Name</label>
          <input className="field" value={form.name} onChange={set("name")} placeholder="Your name" />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="field" type="email" value={form.email} onChange={set("email")} placeholder="you@email.com" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">WhatsApp (optional)</label>
          <input className="field" value={form.phone} onChange={set("phone")} placeholder="03xx xxxxxxx" />
        </div>
        <div>
          <label className="label">Topic</label>
          <select className="field" value={form.topic} onChange={set("topic")}>
            {["Staying with us", "Events & workshops", "Hosting an event", "Collaborations", "Something else"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Message</label>
        <textarea className="field min-h-32" value={form.message} onChange={set("message")} placeholder="Assalam-o-alaikum — tell us what's on your mind…" />
      </div>
      <input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="hidden" tabIndex={-1} aria-hidden />
      <button onClick={submit} disabled={busy} className="btn btn-primary w-full !py-4">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <>Send it <ArrowRight size={16} /></>}
      </button>
      {error && <p className="text-sm text-center font-medium">{error}</p>}
    </div>
  );
}
