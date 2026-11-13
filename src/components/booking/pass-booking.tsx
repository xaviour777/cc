"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Home,
  Loader2,
  MessageCircle,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { submitPass } from "@/lib/pass-actions";
import { addDaysISO, cx, pkr, todayISO } from "@/lib/utils";

type EventOption = {
  slug: string;
  title: string;
  kind: string;
  startDate: string | null;
  endDate: string | null;
  timeLabel: string | null;
  durationLabel: string | null;
  excerpt: string;
  ticketPkr: number;
  seatsLeft: number;
};
type Done = Extract<Awaited<ReturnType<typeof submitPass>>, { ok: true }>;

const shortDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

function dateRange(e: EventOption) {
  if (!e.startDate) return "Dates announced soon";
  const end = e.endDate && e.endDate > e.startDate ? e.endDate : null;
  return end ? `${shortDate(e.startDate)} – ${shortDate(end)}` : shortDate(e.startDate);
}

export default function PassBooking({
  events,
  whatsapp,
  initialEvent,
  member,
}: {
  events: EventOption[];
  whatsapp: string;
  initialEvent?: string;
  member: { name: string; email: string; phone: string } | null;
}) {
  const [eventSlug, setEventSlug] = useState(initialEvent ?? (events.length === 1 ? events[0].slug : ""));
  const [name, setName] = useState(member?.name ?? "");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [whats, setWhats] = useState("");
  const [sameWa, setSameWa] = useState(true);
  const [email, setEmail] = useState(member?.email ?? "");
  const [guests, setGuests] = useState(1);
  const [wantsStay, setWantsStay] = useState(false);
  const [stayFrom, setStayFrom] = useState("");
  const [stayTo, setStayTo] = useState("");
  const [city, setCity] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  const event = events.find((e) => e.slug === eventSlug) ?? null;

  const choose = (slug: string) => {
    setEventSlug(slug);
    setError(null);
    const e = events.find((x) => x.slug === slug);
    // Stay dates default to the workshop days.
    if (e?.startDate) {
      setStayFrom(e.startDate < todayISO() ? todayISO() : e.startDate);
      setStayTo(addDaysISO(e.endDate && e.endDate > e.startDate ? e.endDate : e.startDate, 1));
    }
    setTimeout(() => document.getElementById("pass-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const openStay = () => {
    if (!stayFrom) {
      const start = event?.startDate && event.startDate >= todayISO() ? event.startDate : addDaysISO(todayISO(), 1);
      setStayFrom(start);
      setStayTo(addDaysISO(event?.endDate && event.endDate > start ? event.endDate : start, 1));
    }
    setWantsStay(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || busy) return;
    setBusy(true);
    setError(null);
    try {
      const utm: Record<string, string> = {};
      try {
        const sp = new URLSearchParams(window.location.search);
        for (const k of ["utm_source", "utm_medium", "utm_campaign"]) if (sp.get(k)) utm[k] = sp.get(k)!;
      } catch {}
      const res = await submitPass({
        eventSlug: event.slug,
        name,
        age: Number(age),
        gender,
        phone,
        whatsapp: sameWa ? phone : whats,
        email,
        guestsCount: guests,
        stay: wantsStay ? { from: stayFrom, to: stayTo, city } : null,
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
          Your {done.what} request is in{done.stay ? ", and so is your stay request" : ""}. Our team will call or
          WhatsApp you shortly to confirm and take payment.
        </p>
        <p className="font-display font-extrabold text-3xl md:text-4xl tracking-tight mt-5 select-all">{done.reference}</p>
        <div className="grid sm:grid-cols-3 gap-3 mt-8 text-left">
          {[
            { icon: MessageCircle, t: "1 · We call you", d: "A team member calls / WhatsApps to confirm your seat." },
            { icon: ShieldCheck, t: "2 · Add your ID", d: "Upload CNIC or passport before you come, so check-in takes a minute." },
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
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Assalam-o-alaikum! My booking reference is ${done.reference} (${done.what}).`)}`}
            >
              Chat on WhatsApp
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Step 1: the workshop */}
      <div className="space-y-3">
        {events.map((e) => {
          const active = eventSlug === e.slug;
          const full = e.seatsLeft < 1;
          return (
            <div
              key={e.slug}
              className={cx(
                "rounded-3xl border p-6 md:p-7 transition-colors",
                active ? "border-ink bg-mist" : "border-line bg-paper",
                full && "opacity-60"
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-5 justify-between">
                <div className="flex-1">
                  <h2 className="font-display font-bold text-2xl tracking-tight">{e.title}</h2>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-ink-soft">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} /> {dateRange(e)}</span>
                    {e.timeLabel && <span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> {e.timeLabel}</span>}
                    <span className="inline-flex items-center gap-1.5"><Users size={14} /> {full ? "Fully booked" : `${e.seatsLeft} seats left`}</span>
                  </div>
                  {e.excerpt && <p className="text-[14.5px] text-ink-soft mt-3 leading-relaxed line-clamp-3">{e.excerpt}</p>}
                  <Link href={`/events/${e.slug}`} className="u-link text-sm font-medium mt-3 inline-block">
                    Full details &amp; schedule
                  </Link>
                </div>
                <div className="sm:text-right shrink-0">
                  <p className="font-display font-extrabold text-3xl tracking-tight">{e.ticketPkr > 0 ? pkr(e.ticketPkr) : "Free"}</p>
                  {e.ticketPkr > 0 && <p className="text-xs text-ink-soft">per person · {e.durationLabel ?? "full workshop"}</p>}
                  <button
                    type="button"
                    disabled={full}
                    onClick={() => choose(e.slug)}
                    className={cx("btn mt-4", active ? "btn-outline" : "btn-primary")}
                  >
                    {active ? <><Check size={15} /> Selected</> : <>Book pass <ArrowRight size={15} /></>}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {events.length === 0 && (
          <p className="rounded-2xl bg-mist p-6 text-sm text-center">
            No workshop is open for booking right now.{" "}
            {whatsapp ? (
              <a className="u-link font-medium" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
                Message us on WhatsApp
              </a>
            ) : (
              "Check back soon"
            )}{" "}
            to hear about the next one first.
          </p>
        )}
      </div>

      {/* Step 2: the form */}
      {event && (
        <form id="pass-form" onSubmit={submit} className="scroll-mt-28 mt-6 rounded-3xl border border-line bg-paper p-6 md:p-8">
          <p className="kicker text-ink-soft">Your details</p>
          <p className="font-semibold mt-2">
            {event.title} · {event.ticketPkr > 0 ? `${pkr(event.ticketPkr)} per person` : "Free"}
          </p>

          <div className="grid sm:grid-cols-2 gap-3 mt-4">
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
            <div>
              <label className="label">Guests</label>
              <select className="field" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "person" : "people"}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <input type="text" tabIndex={-1} autoComplete="off" className="hidden" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} aria-hidden />

          {/* Stay request for out-of-city guests: dates only, no prices */}
          <div className={cx("mt-6 rounded-3xl p-6 md:p-7 transition-colors", wantsStay ? "bg-ink text-paper" : "bg-mist")}>
            <div className="flex items-start gap-4">
              <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-paper text-ink">
                <Home size={19} />
              </span>
              <div className="flex-1">
                <p className="font-display font-bold text-xl tracking-tight">Door shehar se aa rahe ho?</p>
                <p className={cx("text-[14.5px] mt-2 leading-relaxed", wantsStay ? "text-paper/75" : "text-ink-soft")}>
                  Hotel dhoondne ki tension chhoro. Workshop ke din hamare ghar, Content Colony mein raho:
                  subah ki chai, raat ki gup-shup, aur apne jaise creators ke saath. Ajnabi ban kar aao, dost ban kar jao.
                </p>
                {!wantsStay ? (
                  <button type="button" onClick={openStay} className="btn btn-primary !py-2.5 !px-5 text-sm mt-4">
                    <Sparkles size={15} /> Haan, mujhe bhi rehna hai
                  </button>
                ) : (
                  <div className="mt-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label !text-paper/70">Arrive</label>
                        <input type="date" required className="field !bg-paper !text-ink" min={todayISO()} value={stayFrom} onChange={(e) => setStayFrom(e.target.value)} />
                      </div>
                      <div>
                        <label className="label !text-paper/70">Leave</label>
                        <input type="date" required className="field !bg-paper !text-ink" min={addDaysISO(stayFrom || todayISO(), 1)} value={stayTo} onChange={(e) => setStayTo(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="label !text-paper/70">Coming from which city?</label>
                      <input className="field !bg-paper !text-ink" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Karachi, Islamabad, Multan…" />
                    </div>
                    <p className="text-[13px] text-paper/70">
                      This is just a request. Our team will share the details and confirm your bed on the call.
                    </p>
                    <button type="button" onClick={() => setWantsStay(false)} className="text-[12.5px] underline underline-offset-2 text-paper/70">
                      No thanks, just the workshop
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-line pt-5">
            <div className="text-sm">
              <p className="font-semibold">
                {event.ticketPkr > 0 ? `${pkr(event.ticketPkr * guests)}` : "Free entry"}
                {wantsStay ? " + stay request" : ""}
              </p>
              <p className="text-ink-soft text-[12.5px] mt-0.5">Nothing to pay now. We confirm by phone / WhatsApp.</p>
            </div>
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? <Loader2 size={16} className="animate-spin" /> : null}
              {wantsStay ? "Book pass + request stay" : "Book my pass"} <ArrowRight size={16} />
            </button>
          </div>
          {error && <p className="mt-3 text-sm font-medium">{error}</p>}
        </form>
      )}
    </div>
  );
}
