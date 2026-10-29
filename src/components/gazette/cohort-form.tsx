"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { applyForCohort } from "@/lib/actions";

const CRAFTS = [
  "Colorist / Finishing Editor (کلر گریڈنگ و ایڈیٹنگ)",
  "Cinematographer / Director (سینماٹوگرافی و ڈائریکشن)",
  "Technical Essayist / Copywriter (تکنیکی تحریر و مواد)",
  "Independent Producer / Agency Lead (پروڈکشن ہاؤس لیڈ)",
  "Creative Technologist (کریٹو ٹیکنالوجی)",
];

const input =
  "w-full px-3 py-2.5 bg-paper border border-line text-ink text-[14px] focus:outline-none focus:border-ink placeholder:text-ink-soft/50";

export default function CohortForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [craft, setCraft] = useState(CRAFTS[0]);
  const [subscribe, setSubscribe] = useState(true);
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await applyForCohort({ name, email, whatsapp, craft, subscribe, honeypot });
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
      <div className="bg-paper border border-line p-6 text-center space-y-2">
        <Check className="mx-auto" size={28} />
        <p className="font-news text-[22px]">Application received</p>
        <p className="text-[14px] text-ink-soft">Our team will reach out on WhatsApp or email about Cohort IV.</p>
        <p lang="ur" dir="rtl" className="text-[14px] text-ink-soft">
          آپ کی درخواست موصول ہو گئی ہے۔ ہم جلد آپ سے رابطہ کریں گے۔
        </p>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <label className="space-y-1.5 block">
          <span className="gz-label block">Name / نام</span>
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="space-y-1.5 block">
          <span className="gz-label block">Professional craft / شعبہ</span>
          <select className={input} value={craft} onChange={(e) => setCraft(e.target.value)}>
            {CRAFTS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 block">
          <span className="gz-label block">Email / ای میل</span>
          <input
            className={input}
            type="email"
            placeholder="bilal@studio.pk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="space-y-1.5 block">
          <span className="gz-label block">WhatsApp / واٹس ایپ</span>
          <input
            className={input}
            type="tel"
            placeholder="+92 300 0000000"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
        </label>
      </div>
      <input
        type="text"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="hidden"
        tabIndex={-1}
        aria-hidden
      />
      <label className="flex items-start gap-3 p-3 bg-mist cursor-pointer">
        <input
          type="checkbox"
          checked={subscribe}
          onChange={(e) => setSubscribe(e.target.checked)}
          className="mt-1 accent-[var(--ink)]"
        />
        <span className="text-[13px] text-ink-soft">
          Send me the bi-weekly Colony Gazette and invitations to Friday salons in Johar Town.
          <span lang="ur" dir="rtl" className="block text-[12px] mt-1">
            مجھے جمعہ کی نشستوں اور گزٹ کے شماروں میں شامل رکھیں۔
          </span>
        </span>
      </label>
      <div className="flex justify-center pt-1">
        <button
          type="submit"
          disabled={busy}
          className="gz-label w-full sm:w-auto px-10 py-3.5 bg-ink text-paper border border-ink hover:bg-paper hover:text-ink transition-colors disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Apply for Cohort IV // درخواست جمع کروائیں"}
        </button>
      </div>
      {error && <p className="text-sm text-center font-medium">{error}</p>}
    </form>
  );
}
