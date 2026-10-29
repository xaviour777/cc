"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { applyForResidency } from "@/lib/actions";

const DISCIPLINES = [
  "Foley Master & Field Recordist",
  "Film Score Composer (Orchestral / Hybrid)",
  "Cinema Re-recording Mixer (7.1.4 Atmos)",
  "Sound Restoration & Archival Engineer",
  "Narrative Podcast & Sonic Documentarian",
];

const input =
  "w-full px-3 py-2.5 bg-paper border border-line text-ink text-[14px] focus:outline-none focus:border-ink placeholder:text-ink-soft/50";

export default function ResidencyForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    whatsapp: "",
    discipline: DISCIPLINES[0],
    portfolio: "",
    proposal: "",
  });
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await applyForResidency({ ...form, honeypot });
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
      <div className="p-5 bg-ink text-paper text-center space-y-1">
        <p className="gz-label">Dossier received</p>
        <p className="text-[14px]">Our sound team will contact you on WhatsApp within 48 hours.</p>
        <p lang="ur" dir="rtl" className="text-[14px]">
          آپ کی درخواست موصول ہو گئی ہے۔ ہم ۴۸ گھنٹوں میں رابطہ کریں گے۔
        </p>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <label className="block space-y-1.5">
          <span className="gz-label block">Applicant name / نام</span>
          <input className={input} placeholder="e.g. Asad Malik" value={form.name} onChange={set("name")} required />
        </label>
        <label className="block space-y-1.5">
          <span className="gz-label block">WhatsApp / رابطہ</span>
          <input
            className={input}
            type="tel"
            placeholder="+92 300 1234567"
            value={form.whatsapp}
            onChange={set("whatsapp")}
            required
          />
        </label>
        <label className="block space-y-1.5">
          <span className="gz-label block">Email / ای میل</span>
          <input
            className={input}
            type="email"
            placeholder="asad@studio.pk"
            value={form.email}
            onChange={set("email")}
            required
          />
        </label>
        <label className="block space-y-1.5">
          <span className="gz-label block">Primary discipline / بنیادی شعبہ</span>
          <select className={input} value={form.discipline} onChange={set("discipline")}>
            {DISCIPLINES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="gz-label block">Portfolio or reel URL / پورٹ فولیو</span>
        <input
          className={input}
          type="url"
          placeholder="https://soundcloud.com/..."
          value={form.portfolio}
          onChange={set("portfolio")}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="gz-label block">Acoustic proposal / پروجیکٹ کا خلاصہ</span>
        <textarea
          className={input}
          rows={3}
          placeholder="Describe the film score, Foley landscape or acoustic research you want to complete in Johar Town..."
          value={form.proposal}
          onChange={set("proposal")}
        />
      </label>
      <input
        type="text"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="hidden"
        tabIndex={-1}
        aria-hidden
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <span className="gz-label text-ink-soft">Applications close: 15 Dec</span>
        <button
          type="submit"
          disabled={busy}
          className="gz-label px-8 py-3 bg-ink text-paper border border-ink hover:bg-paper hover:text-ink transition-colors disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Submit dossier // جمع کروائیں"}
        </button>
      </div>
      {error && <p className="text-sm font-medium">{error}</p>}
    </form>
  );
}
