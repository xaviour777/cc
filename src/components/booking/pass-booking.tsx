"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  Check,
  Coffee,
  DoorOpen,
  Home,
  Loader2,
  MessageCircle,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import { submitPass } from "@/lib/pass-actions";
import { addDaysISO, cx, formatDate, pkr, todayISO } from "@/lib/utils";

type EventOption = {
  slug: string;
  title: string;
  kind: string;
  startDate: string | null;
  timeLabel: string | null;
  ticketPkr: number;
  seatsLeft: number;
};
type StayOption = { key: "SHARED_BUNK" | "PRIVATE_ROOM"; name: string; nightlyPkr: number; weeklyPkr: number | null };
type Kind = "DAY_PASS" | "EVENT";
type Done = Extract<Awaited<ReturnType<typeof submitPass>>, { ok: true }>;

export default function PassBooking({
  events,
  dayPassPkr,
  stays,
  minStay,
  whatsapp,
  initialKind,
  initialEvent,
  member,
}: {
  events: EventOption[];
  dayPassPkr: number;
  stays: StayOption[];
  minStay: number;
  whatsapp: string;
  initialKind: Kind | null;
  initialEvent?: string;
  member: { name: string; email: string; phone: string } | null;
}) {
  const [kind, setKind] = useState<Kind | null>(initialKind);
  const [eventSlug, setEventSlug] = useState(initialEvent ?? events[0]?.slug ?? "");
  const [date, setDate] = useState(() => addDaysISO(todayISO(), 1));
  const [name, setName] = useState(member?.name ?? "");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [whats, setWhats] = useState("");
  const [sameWa, setSameWa] = useState(true);
  const [email, setEmail] = useState(member?.email ?? "");
  const [guests, setGuests] = useState(1);
  const [wantsStay, setWantsStay] = useState(false);
  const [city, setCity] = useState("");
  const [stayKey, setStayKey] = useState<StayOption["key"]>("SHARED_BUNK");
  const [nights, setNights] = useState(Math.max(3, minStay));
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  const event = events.find((e) => e.slug === eventSlug) ?? null;
  const eventHasDate = Boolean(event?.startDate);
  const visitDate = kind === "EVENT" && event?.startDate ? event.startDate : date;
  const unitPrice = kind === "EVENT" ? event?.ticketPkr ?? 0 : dayPassPkr;
  const stay = stays.find((s) => s.key === stayKey);
  const stayPrice = useMemo(() => {
    if (!stay || !stay.nightlyPkr) return 0;
    if (nights === 7 && stay.weeklyPkr) return stay.weeklyPkr;
    return stay.nightlyPkr * nights;
  }, [stay, nights]);

  const choose = (k: Kind) => {
    setKind(k);
    setError(null);
    setTimeout(() => document.getElementById("pass-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kind || busy) return;
    setBusy(true);
    setError(null);
    try {
      const utm: Record<string, string> = {};
      try {
        const sp = new URLSearchParams(window.location.search);
        for (const k of ["utm_source", "utm_medium", "utm_campaign"]) if (sp.get(k)) utm[k] = sp.get(k)!;
      } catch {}
      const res = await submitPass({
        kind,
        eventSlug: kind === "EVENT" ? eventSlug : undefined,
        visitDate,
        name,
        age: Number(age),
        phone,
        whatsapp: sameWa ? phone : whats,
        email,
        city: wantsStay ? city : undefined,
        guestsCount: guests,
        stay: wantsStay ? { key: stayKey, nights } : null,
        utm,
        honeypot,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone(res);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Something went wrong. Please try again, or message us on WhatsApp.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-3xl border border-line bg-paper p-8 md:p-12 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-mist flex items-center justify-center">
          <PartyPopper size={24} />
        </div>
        <h2 className="display-md mt-6">Shukriya, {name.split(" ")[0]}!</h2>
        <p className="text-ink-soft mt-3 max-w-md mx-auto leading-relaxed">
          Your {done.what} request for <b className="text-ink">{formatDate(done.visitDate)}</b> is in.
          Our team will call or WhatsApp you shortly to confirm and take payment.
        </p>
        <p className="font-display font-extrabold text-3xl md:text-4xl tracking-tight mt-5 select-all">{done.reference}</p>
        {done.stay && (
          <p className="text-sm mt-3">
            <Home size={14} className="inline -mt-0.5" /> Your {done.stay.nights}-night stay is held too ({done.stay.reference}).
          </p>
        )}
        {done.stayNote && <p className="text-sm text-ink-soft mt-3">We&apos;ll sort your stay on the call.</p>}
        <div className="grid sm:grid-cols-3 gap-3 mt-8 text-left">
          {[
            { icon: MessageCircle, t: "1 · We call you", d: "A team member calls / WhatsApps to confirm your date." },
            { icon: ShieldCheck, t: "2 · Add your ID", d: "Upload CNIC or passport before you come — check-in takes a minute." },
            { icon: Users, t: "3 · Meet your people", d: "Show your reference at the door and walk in." },
          ].map((s) => (
            <div key={s.t} className="rounded-2xl bg-mist p-5">
              <s.icon size={18} />
              <p className="font-semibold mt-3 text-sm">{s.t}</p>
              <p className="text-xs text-ink-soft mt-1.5 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Link href={done.portal} className="btn btn-primary">
            Add your ID now <ArrowRight size={16} />
          </Link>
          {whatsapp && (
            <a
              className="btn btn-outline"
              target="_blank"
              rel="noreferrer"
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Assalam-o-alaikum! My booking reference is ${done.reference} (${done.what}, ${done.visitDate}).`)}`}
            >
              Chat on WhatsApp
            </a>
          )}
        </div>
      </div>
    );
  }

  const choices = [
    {
      k: "DAY_PASS" as const,
      Icon: Coffee,
      title: "Community Day Pass",
      text: "Work, create and hang out for the day with creators like you.",
      price: dayPassPkr > 0 ? `${pkr(dayPassPkr)} / person` : "Price shared on call",
    },
    {
      k: "EVENT" as const,
      Icon: Ticket,
      title: "Workshop / Event Pass",
      text: events.length ? `${events.length} upcoming — pick yours in the form.` : "No events open right now.",
      price: events.length ? "Seat confirmed on call" : "",
      disabled: events.length === 0,
    },
  ];

  return (
    <div>
      {/* Step 1: what are you booking? */}
      <div className="grid sm:grid-cols-3 gap-3">
        {choices.map((c) => (
          <button
            key={c.k}
            type="button"
            disabled={c.disabled}
            onClick={() => choose(c.k)}
            className={cx(
              "text-left rounded-2xl border p-5 transition-all duration-300",
              kind === c.k ? "border-ink bg-mist" : "border-line hover:border-ink-soft bg-paper",
              c.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex items-center justify-between">
              <c.Icon size={20} />
              {kind === c.k && (
                <span className="w-5 h-5 rounded-full bg-ink text-paper flex items-center justify-center">
                  <Check size={12} />
                </span>
              )}
            </div>
            <p className="font-semibold mt-3">{c.title}</p>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">{c.text}</p>
            {c.price && <p className="mt-3 text-sm font-semibold">{c.price}</p>}
          </button>
        ))}
        <Link
          href="/stay#book"
          className="text-left rounded-2xl border border-line hover:border-ink-soft bg-paper p-5 transition-all duration-300"
        >
          <BedDouble size={20} />
          <p className="font-semibold mt-3">Stay {minStay}+ nights</p>
          <p className="text-xs text-ink-soft mt-1 leading-relaxed">Bunks and private rooms with live availability.</p>
          <p className="mt-3 text-sm font-semibold inline-flex items-center gap-1">
            See rooms <ArrowRight size={14} />
          </p>
        </Link>
      </div>

      {/* Step 2: the form */}
      {kind && (
        <form id="pass-form" onSubmit={submit} className="scroll-mt-28 mt-6 rounded-3xl border border-line bg-paper p-6 md:p-8">
          <p className="kicker text-ink-soft">{kind === "EVENT" ? "Workshop / Event Pass" : "Community Day Pass"}</p>

          {kind === "EVENT" && (
            <div className="mt-4">
              <label className="label">Which one?</label>
              <select className="field" value={eventSlug} onChange={(e) => setEventSlug(e.target.value)}>
                {events.map((e) => (
                  <option key={e.slug} value={e.slug} disabled={e.seatsLeft < 1}>
                    {e.title}
                    {e.startDate ? ` · ${formatDate(e.startDate)}` : ""}
                    {e.ticketPkr > 0 ? ` · ${pkr(e.ticketPkr)}` : " · Free"}
                    {e.seatsLeft < 1 ? " · Full" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <div>
              <label className="label">Date</label>
              {kind === "EVENT" && eventHasDate ? (
                <p className="field flex items-center gap-2">
                  <CalendarDays size={15} className="text-ink-soft" /> {formatDate(visitDate)}
                  {event?.timeLabel ? ` · ${event.timeLabel}` : ""}
                </p>
              ) : (
                <input type="date" required className="field" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
              )}
            </div>
            <div>
              <label className="label">Guests</label>
              <select className="field" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "guest" : "guests"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Full name</label>
              <input required className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </div>
            <div>
              <label className="label">Age</label>
              <input required type="number" min={10} max={100} inputMode="numeric" className="field" value={age} onChange={(e) => setAge(e.target.value)} />
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
            <div className="sm:col-span-2">
              <label className="label">Email</label>
              <input required type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
          </div>
          <input type="text" tabIndex={-1} autoComplete="off" className="hidden" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} aria-hidden />

          {/* Stay add-on for out-of-city guests */}
          <div className={cx("mt-6 rounded-3xl p-6 md:p-7 transition-colors", wantsStay ? "bg-ink text-paper" : "bg-mist")}>
            <div className="flex items-start gap-4">
              <span className={cx("w-11 h-11 rounded-full flex items-center justify-center shrink-0", wantsStay ? "bg-paper text-ink" : "bg-paper")}>
                <Home size={19} />
              </span>
              <div className="flex-1">
                <p className="font-display font-bold text-xl tracking-tight">Door shehar se aa rahe ho?</p>
                <p className={cx("text-[14.5px] mt-2 leading-relaxed", wantsStay ? "text-paper/75" : "text-ink-soft")}>
                  Hotel dhoondne ki tension chhoro. {minStay} din hamare ghar, Content Colony mein raho:
                  subah ki chai, raat ki gup-shup, aur apne jaise creators ke saath.
                  Ajnabi ban kar aao, dost ban kar jao.
                </p>
                {!wantsStay ? (
                  <button type="button" onClick={() => setWantsStay(true)} className="btn btn-primary !py-2.5 !px-5 text-sm mt-4">
                    <Sparkles size={15} /> Haan, mujhe bhi rehna hai
                  </button>
                ) : (
                  <div className="mt-5 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-3">
                      {stays.map((s) => (
                        <button
                          type="button"
                          key={s.key}
                          onClick={() => setStayKey(s.key)}
                          className={cx(
                            "text-left rounded-2xl border p-4 transition-colors",
                            stayKey === s.key ? "border-paper bg-paper text-ink" : "border-paper/25 hover:border-paper/60"
                          )}
                        >
                          {s.key === "SHARED_BUNK" ? <BedDouble size={17} /> : <DoorOpen size={17} />}
                          <p className="font-semibold mt-2 text-sm">{s.name}</p>
                          <p className={cx("text-xs mt-0.5", stayKey === s.key ? "text-ink-soft" : "text-paper/60")}>
                            {s.nightlyPkr ? `${pkr(s.nightlyPkr)} / night` : "Price on call"}
                          </p>
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[Math.max(3, minStay), 7].map((n) => (
                        <button
                          type="button"
                          key={n}
                          onClick={() => setNights(n)}
                          className={cx(
                            "rounded-full px-4 py-2 text-sm font-medium border transition-colors",
                            nights === n ? "bg-paper text-ink border-paper" : "border-paper/30 hover:border-paper/70"
                          )}
                        >
                          {n === 7 ? "1 week" : `${n} nights`}
                        </button>
                      ))}
                    </div>
                    <div>
                      <label className="label !text-paper/70">Which city are you coming from?</label>
                      <input className="field !bg-paper !text-ink" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Karachi, Islamabad, Multan…" />
                    </div>
                    <p className="text-[13px] text-paper/70">
                      {formatDate(visitDate)} → {formatDate(addDaysISO(visitDate, nights))}
                      {stayPrice ? ` · ${pkr(stayPrice)}` : ""} · we hold your bed now and confirm on the call.
                    </p>
                    <button type="button" onClick={() => setWantsStay(false)} className="text-[12.5px] underline underline-offset-2 text-paper/70">
                      No thanks, just the pass
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary + submit */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-line pt-5">
            <div className="text-sm">
              <p className="font-semibold">
                {unitPrice > 0 ? pkr(unitPrice * guests + (wantsStay ? stayPrice : 0)) : wantsStay && stayPrice ? `Stay ${pkr(stayPrice)} · pass price on call` : "Price confirmed on call"}
              </p>
              <p className="text-ink-soft text-[12.5px] mt-0.5">Nothing to pay now. We confirm by phone / WhatsApp.</p>
            </div>
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? <Loader2 size={16} className="animate-spin" /> : null}
              {wantsStay ? "Book pass + stay" : "Book my pass"} <ArrowRight size={16} />
            </button>
          </div>
          {error && <p className="mt-3 text-sm font-medium">{error}</p>}
        </form>
      )}
    </div>
  );
}
