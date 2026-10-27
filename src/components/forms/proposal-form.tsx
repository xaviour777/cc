"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Loader2 } from "lucide-react";
import { submitProposal } from "@/lib/actions";

const CATEGORIES = [
  "YouTube Automation",
  "Facebook Content Creation",
  "Facebook Monetization",
  "Instagram Reels",
  "TikTok Content Creation",
  "AI Filmmaking",
  "Video Editing",
  "AI Tools & Automation",
  "Freelancing",
  "Personal Branding",
  "Content Marketing",
  "Digital Entrepreneurship",
  "Community meetup",
  "Something new",
];

export default function ProposalForm() {
  const [f, setF] = useState({
    organizerName: "",
    email: "",
    whatsapp: "",
    brand: "",
    socialUrl: "",
    title: "",
    category: CATEGORIES[0],
    description: "",
    preferredDate: "",
    expectedAttendees: "",
    ticketSuggestion: "",
    requirements: "",
    speakerBio: "",
    coverImage: "",
  });
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await submitProposal({
        ...f,
        expectedAttendees: f.expectedAttendees ? Number(f.expectedAttendees) : undefined,
        preferredDate: f.preferredDate || undefined,
        honeypot,
      });
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
        <p className="display-md mt-5">Proposal received.</p>
        <p className="text-ink-soft mt-2 text-sm max-w-md mx-auto leading-relaxed">
          Our team reviews every proposal personally. If it fits the Colony, we&apos;ll
          reach out on WhatsApp to shape the event together. Only admin-approved
          events ever go public.
        </p>
      </div>
    );

  return (
    <div className="rounded-3xl border border-line bg-paper p-6 md:p-8 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Organizer name *</label>
          <input className="field" value={f.organizerName} onChange={set("organizerName")} />
        </div>
        <div>
          <label className="label">Email *</label>
          <input className="field" type="email" value={f.email} onChange={set("email")} />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">WhatsApp number *</label>
          <input className="field" value={f.whatsapp} onChange={set("whatsapp")} placeholder="03xx xxxxxxx" />
        </div>
        <div>
          <label className="label">Brand / organization</label>
          <input className="field" value={f.brand} onChange={set("brand")} />
        </div>
      </div>
      <div>
        <label className="label">Social profile link</label>
        <input className="field" value={f.socialUrl} onChange={set("socialUrl")} placeholder="https://…" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Proposed event title *</label>
          <input className="field" value={f.title} onChange={set("title")} />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="field" value={f.category} onChange={set("category")}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Description *</label>
        <textarea className="field min-h-28" value={f.description} onChange={set("description")} placeholder="What will people learn, make or experience?" />
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Preferred date</label>
          <input className="field" type="date" value={f.preferredDate} onChange={set("preferredDate")} />
        </div>
        <div>
          <label className="label">Expected attendees</label>
          <input className="field" type="number" min={1} value={f.expectedAttendees} onChange={set("expectedAttendees")} />
        </div>
        <div>
          <label className="label">Ticket price suggestion</label>
          <input className="field" value={f.ticketSuggestion} onChange={set("ticketSuggestion")} placeholder="e.g. PKR 3,000 or free" />
        </div>
      </div>
      <div>
        <label className="label">Speaker profile</label>
        <textarea className="field min-h-20" value={f.speakerBio} onChange={set("speakerBio")} placeholder="Who's teaching, and why should the Colony trust them?" />
      </div>
      <div>
        <label className="label">Special requirements</label>
        <input className="field" value={f.requirements} onChange={set("requirements")} placeholder="Projector, studio access, mics…" />
      </div>
      <div>
        <label className="label">Cover image URL</label>
        <input className="field" value={f.coverImage} onChange={set("coverImage")} placeholder="https://… (optional)" />
      </div>
      <input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="hidden" tabIndex={-1} aria-hidden />
      <button onClick={submit} disabled={busy} className="btn btn-primary w-full !py-4">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <>Send the proposal <ArrowUpRight size={16} /></>}
      </button>
      <p className="text-[12px] text-ink-soft text-center">
        No account needed. Proposals go straight to our admin team — nothing is public until we approve it.
      </p>
      {error && <p className="text-sm text-center font-medium">{error}</p>}
    </div>
  );
}
