"use client";

import { useState } from "react";
import { ArrowRight, BedDouble, Check, DoorOpen, Loader2, MessageCircle, PartyPopper, ShieldCheck, Sparkles } from "lucide-react";
import { submitPass } from "@/lib/pass-actions";
import { addDaysISO, cx, todayISO } from "@/lib/utils";

type Done = Extract<Awaited<ReturnType<typeof submitPass>>, { ok: true }>;
export type RoomChoice = "Bunker" | "Private Room";

export default function StayRequest({
  whatsapp,
  minStay,
  member,
  initialRoom = "Bunker",
}: {
  initialRoom?: RoomChoice;
  whatsapp: string;
  minStay: number;
  member: { name: string; email: string; phone: string } | null;
}) {
  const [room, setRoom] = useState<RoomChoice>(initialRoom);
  const [from, setFrom] = useState(addDaysISO(todayISO(), 1));
  const [to, setTo] = useState(addDaysISO(todayISO(), 1 + Math.max(3, minStay)));
  const [name, setName] = useState(member?.name ?? "");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [sameWa, setSameWa] = useState(true);
  const [whats, setWhats] = useState("");
  const [email, setEmail] = useState(member?.email ?? "");
  const [city, setCity] = useState("");
  const [pitch, setPitch] = useState("");
  const [guests, setGuests] = useState(1);
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const utm: Record<string, string> = {};
      try {
        const sp = new URLSearchParams(window.location.search);
        for (const k of ["utm_source", "utm_medium", "utm_campaign"]) if (sp.get(k)) utm[k] = sp.get(k)!;
      } catch {}
      const res = await submitPass({
        name,
        age: Number(age),
        gender,
        phone,
        whatsapp: sameWa ? phone : whats,
        email,
        guestsCount: guests,
        stay: { from, to, city, room, pitch },
        utm,
        honeypot,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone(res);
      document.getElementById("request")?.scrollIntoView({ behavior: "smooth" });
    } catch {
      setError("Something went wrong. Please try again, or message us on WhatsApp.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-3xl bg-ink text-paper p-8 md:p-12 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-paper text-ink flex items-center justify-center">
          <PartyPopper size={24} />
        </div>
        <h2 className="display-md mt-6">Welcome to the shortlist, {name.split(" ")[0]}.</h2>
        <p className="text-paper/70 mt-3 max-w-md mx-auto leading-relaxed">
          Your request to live at the Colony is with our team. We read every one personally, and we&apos;ll
          reach you on WhatsApp shortly to talk about your stay.
        </p>
        <p className="font-display font-extrabold text-3xl md:text-4xl tracking-tight mt-5 select-all">{done.reference}</p>
        <div className="grid sm:grid-cols-3 gap-3 mt-8 text-left">
          {[
            { icon: MessageCircle, t: "1 · We talk", d: "A team member WhatsApps you to hear your story and share the details." },
            { icon: ShieldCheck, t: "2 · Add your ID", d: "Upload CNIC or passport before you arrive, so check-in takes a minute." },
            { icon: Sparkles, t: "3 · Move in", d: "Show your reference at the door. Your people are waiting." },
          ].map((s) => (
            <div key={s.t} className="rounded-2xl bg-paper/10 p-5">
              <s.icon size={18} />
              <p className="font-semibold mt-3 text-sm">{s.t}</p>
              <p className="text-xs text-paper/65 mt-1.5 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <a href={done.portal} className="btn bg-paper text-ink hover:opacity-90">
            Add my ID now <ArrowRight size={16} />
          </a>
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi! My stay request is ${done.reference}`)}`} className="btn border border-paper/30 text-paper hover:bg-paper/10">
              <MessageCircle size={16} /> WhatsApp us
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-line bg-paper p-6 md:p-10">
      <p className="kicker text-ink-soft">Your request</p>
      <h3 className="font-display font-bold text-2xl md:text-3xl tracking-tight mt-2">Tell us when, and tell us who you are.</h3>

      {/* Room choice */}
      <div className="grid sm:grid-cols-2 gap-3 mt-6">
        {([
          { key: "Bunker", Icon: BedDouble, d: "Your own bunk in a shared room of creators" },
          { key: "Private Room", Icon: DoorOpen, d: "A quiet room of your own, the colony outside" },
        ] as const).map(({ key, Icon, d }) => (
          <button
            key={key}
            type="button"
            onClick={() => setRoom(key)}
            className={cx(
              "text-left rounded-2xl border p-4 flex gap-3 items-start transition-colors",
              room === key ? "border-ink bg-mist" : "border-line hover:bg-mist",
            )}
          >
            <Icon size={19} className="mt-0.5 shrink-0" />
            <span className="flex-1">
              <span className="font-semibold block">{key === "Bunker" ? "The Bunker" : "Private Room"}</span>
              <span className="text-[13px] text-ink-soft">{d}</span>
            </span>
            {room === key && <Check size={17} className="shrink-0" />}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-5">
        <div className="grid grid-cols-2 gap-3 sm:col-span-2">
          <div>
            <label className="label">Arriving</label>
            <input type="date" required className="field" min={todayISO()} value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">Leaving</label>
            <input type="date" required className="field" min={addDaysISO(from || todayISO(), 1)} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Full name</label>
          <input required className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Age</label>
            <input required type="number" min={10} max={100} inputMode="numeric" className="field" value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div>
            <label className="label">Gender</label>
            <select required className="field" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="" disabled>Select</option>
              <option>Male</option>
              <option>Female</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Phone</label>
          <input required type="tel" className="field" placeholder="03xx xxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          <label className="flex items-center gap-2 text-[12.5px] text-ink-soft mt-2">
            <input type="checkbox" checked={sameWa} onChange={(e) => setSameWa(e.target.checked)} /> Same number on WhatsApp
          </label>
        </div>
        <div>
          <label className="label">WhatsApp</label>
          {sameWa ? (
            <p className="field text-ink-soft">{phone || "Same as phone"}</p>
          ) : (
            <input required type="tel" className="field" placeholder="03xx xxxxxxx" value={whats} onChange={(e) => setWhats(e.target.value)} />
          )}
        </div>
        <div>
          <label className="label">Email</label>
          <input required type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Your city</label>
            <input className="field" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Karachi, Multan…" />
          </div>
          <div>
            <label className="label">Guests</label>
            <select className="field" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "person" : "people"}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="label">What are you building? (optional)</label>
          <textarea
            rows={3}
            className="field"
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            placeholder="Your channel, your film, your startup, your next big idea… a line or two is enough."
          />
        </div>
      </div>
      <input type="text" tabIndex={-1} autoComplete="off" className="hidden" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} aria-hidden />

      <div className="mt-6 flex justify-end border-t border-line pt-5">
        <button type="submit" disabled={busy} className="btn btn-primary">
          {busy ? <Loader2 size={16} className="animate-spin" /> : null}
          Count me in <ArrowRight size={16} />
        </button>
      </div>
      {error && <p className="mt-3 text-sm font-medium">{error}</p>}
    </form>
  );
}
