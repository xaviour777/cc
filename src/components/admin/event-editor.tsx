"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { upsertEvent } from "@/app/admin/actions";
import type { Event } from "@/db/schema";

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
  "Community",
  "Gaming",
];

export default function EventEditor({ event }: { event?: Event }) {
  const [f, setF] = useState({
    id: event?.id ?? 0,
    title: event?.title ?? "",
    slug: event?.slug ?? "",
    kind: event?.kind ?? "WORKSHOP",
    category: event?.category ?? CATEGORIES[0],
    hostName: event?.hostName ?? "",
    hostRole: event?.hostRole ?? "",
    hostImage: event?.hostImage ?? "",
    image: event?.image ?? "",
    excerpt: event?.excerpt ?? "",
    description: event?.description ?? "",
    outcomes: (event?.outcomes ?? []).join("\n"),
    schedule: (event?.schedule ?? []).map((s) => `${s.day} | ${s.title} | ${s.detail}`).join("\n"),
    startDate: event?.startDate ?? "",
    endDate: event?.endDate ?? "",
    timeLabel: event?.timeLabel ?? "",
    durationLabel: event?.durationLabel ?? "",
    venue: event?.venue ?? "Content Colony, Johar Town",
    capacity: event?.capacity ?? 30,
    ticketPkr: event?.ticketPkr ?? 0,
    residentDiscountPct: event?.residentDiscountPct == null ? "" : String(event.residentDiscountPct),
    status: event?.status ?? "DRAFT",
    featured: event?.featured ?? false,
    complianceNote: event?.complianceNote ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const set = (k: keyof typeof f, v: string | number | boolean) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const fd = new FormData();
      fd.set("id", String(f.id));
      for (const key of ["title", "slug", "kind", "category", "hostName", "hostRole", "hostImage", "image", "excerpt", "description", "startDate", "endDate", "timeLabel", "durationLabel", "venue", "complianceNote", "status"] as const)
        fd.set(key, String(f[key]));
      fd.set("capacity", String(f.capacity));
      fd.set("ticketPkr", String(f.ticketPkr));
      if (f.residentDiscountPct !== "") fd.set("residentDiscountPct", String(f.residentDiscountPct));
      if (f.featured) fd.set("featured", "on");
      fd.set("outcomes", JSON.stringify(f.outcomes.split("\n").map((s) => s.trim()).filter(Boolean)));
      fd.set(
        "schedule",
        JSON.stringify(
          f.schedule
            .split("\n")
            .map((line) => line.split("|").map((x) => x.trim()))
            .filter((parts) => parts.length >= 2 && parts[0])
            .map(([day, title, detail]) => ({ day, title, detail: detail ?? "" }))
        )
      );
      const res = await upsertEvent(fd);
      if (!res.ok) {
        setError(res.error ?? "Failed");
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-paper p-5 space-y-4">
      <p className="font-semibold text-sm">{f.id ? `Editing event #${f.id}` : "New event"}</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Title *</label>
          <input className="field" value={f.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div>
          <label className="label">Slug (auto if blank)</label>
          <input className="field" value={f.slug} onChange={(e) => set("slug", e.target.value)} />
        </div>
        <div>
          <label className="label">Kind</label>
          <select className="field" value={f.kind} onChange={(e) => set("kind", e.target.value)}>
            <option value="WORKSHOP">Workshop (ticketed/free)</option>
            <option value="MEETUP">Meetup</option>
            <option value="COMMUNITY">Community / entertainment</option>
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <select className="field" value={f.category} onChange={(e) => set("category", e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Host name</label>
          <input className="field" value={f.hostName} onChange={(e) => set("hostName", e.target.value)} />
        </div>
        <div>
          <label className="label">Host role</label>
          <input className="field" value={f.hostRole} onChange={(e) => set("hostRole", e.target.value)} />
        </div>
        <div>
          <label className="label">Host photo URL</label>
          <input className="field" value={f.hostImage} onChange={(e) => set("hostImage", e.target.value)} />
        </div>
        <div>
          <label className="label">Cover image URL</label>
          <input className="field" value={f.image} onChange={(e) => set("image", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Excerpt</label>
        <input className="field" value={f.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
      </div>
      <div>
        <label className="label">Description (blank line = new paragraph)</label>
        <textarea className="field min-h-28" value={f.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Learning outcomes (one per line)</label>
          <textarea className="field min-h-28" value={f.outcomes} onChange={(e) => set("outcomes", e.target.value)} />
        </div>
        <div>
          <label className="label">Schedule (Day | Title | Detail — one per line, supports multi-day)</label>
          <textarea className="field min-h-28" value={f.schedule} onChange={(e) => set("schedule", e.target.value)} placeholder={"Day 1 | Story | Hooks and characters"} />
        </div>
      </div>
      <div className="grid sm:grid-cols-4 gap-3">
        <div>
          <label className="label">Start date (blank = TBA)</label>
          <input type="date" className="field" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </div>
        <div>
          <label className="label">End date (multi-day)</label>
          <input type="date" className="field" value={f.endDate} onChange={(e) => set("endDate", e.target.value)} />
        </div>
        <div>
          <label className="label">Time label</label>
          <input className="field" value={f.timeLabel} onChange={(e) => set("timeLabel", e.target.value)} placeholder="7:00 PM" />
        </div>
        <div>
          <label className="label">Duration label</label>
          <input className="field" value={f.durationLabel} onChange={(e) => set("durationLabel", e.target.value)} placeholder="3 days" />
        </div>
        <div>
          <label className="label">Venue</label>
          <input className="field" value={f.venue} onChange={(e) => set("venue", e.target.value)} />
        </div>
        <div>
          <label className="label">Seats</label>
          <input type="number" min={1} className="field" value={f.capacity} onChange={(e) => set("capacity", Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Ticket price (PKR, 0 = free)</label>
          <input type="number" min={0} className="field" value={f.ticketPkr} onChange={(e) => set("ticketPkr", Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Resident discount % (blank = site default 25%)</label>
          <input type="number" min={0} max={100} className="field" value={f.residentDiscountPct} onChange={(e) => set("residentDiscountPct", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Compliance / honesty note (shown publicly)</label>
        <input className="field" value={f.complianceNote} onChange={(e) => set("complianceNote", e.target.value)} placeholder="e.g. Dates are announced once the host confirms." />
      </div>
      <div className="flex flex-wrap items-center gap-5">
        <div>
          <label className="label">Status</label>
          <select className="field !w-auto" value={f.status} onChange={(e) => set("status", e.target.value)}>
            {["DRAFT", "PUBLISHED", "FULL", "COMPLETED", "CANCELLED"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm mt-4">
          <input type="checkbox" className="accent-black" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} />
          Featured on homepage
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={submit} disabled={busy} className="btn btn-primary !py-2.5 !px-6 text-sm">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saved ? "Saved" : f.id ? "Save changes" : "Create event"}
        </button>
        {error && <p className="text-sm font-medium">{error}</p>}
      </div>
    </div>
  );
}
