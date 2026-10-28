"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  CalendarDays,
  Check,
  DoorOpen,
  Loader2,
  PartyPopper,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import {
  checkStayAvailability,
  submitBooking,
} from "@/lib/actions";
import { addDaysISO, cx, nightsBetween, pkr, todayISO } from "@/lib/utils";
import AvailabilityCalendar from "@/components/booking/availability-calendar";

type AvailabilityResult = Extract<
  Awaited<ReturnType<typeof checkStayAvailability>>,
  { ok: true }
>;

export type StayProduct = {
  key: "SHARED_BUNK" | "PRIVATE_ROOM";
  name: string;
  tagline: string;
  nightlyPkr: number;
  weeklyPkr: number | null;
  monthlyPkr: number | null;
  maxGuests: number;
};

export default function BookingWidget({
  products,
  minStay,
  hidePrices = false,
  whatsapp = "",
}: {
  products: StayProduct[];
  minStay: number;
  hidePrices?: boolean;
  whatsapp?: string;
}) {
  const [typeKey, setTypeKey] = useState<"SHARED_BUNK" | "PRIVATE_ROOM">("SHARED_BUNK");
  const [checkIn, setCheckIn] = useState(() => addDaysISO(todayISO(), 1));
  const [checkOut, setCheckOut] = useState(() => addDaysISO(todayISO(), 4));
  const [guests, setGuests] = useState(1);
  const [method, setMethod] = useState<"BANK_TRANSFER" | "RAAST" | "CARD_LINK" | "CASH_ON_ARRIVAL">("BANK_TRANSFER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Extract<Awaited<ReturnType<typeof submitBooking>>, { ok: true }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [minStayHit, setMinStayHit] = useState(false);
  const [avail, setAvail] = useState<AvailabilityResult | null>(null);
  const [checking, setChecking] = useState(false);

  const nights = useMemo(
    () => (checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0),
    [checkIn, checkOut]
  );

  const refresh = useCallback(async () => {
    setChecking(true);
    try {
      const res = await checkStayAvailability(checkIn, checkOut);
      setAvail(res.ok ? res : null);
    } finally {
      setChecking(false);
    }
  }, [checkIn, checkOut]);

  useEffect(() => {
    const t = setTimeout(refresh, 250);
    return () => clearTimeout(t);
  }, [refresh]);

  const product = products.find((p) => p.key === typeKey)!;
  const productAvail = avail?.products.find((p) => p.key === typeKey);
  const soldOut = avail && productAvail ? productAvail.available < 1 : false;
  const tooShort = nights > 0 && nights < minStay;
  const quote = tooShort ? null : productAvail?.quote ?? null;

  useEffect(() => {
    if (availabilityFullFor(typeKey)) {
      // auto-suggest the other product when one sells out
      const other = products.find((p) => p.key !== typeKey);
      const otherAvail = avail?.products.find((p) => p.key === other?.key);
      if (other && otherAvail && otherAvail.available > 0) setTypeKey(other.key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avail]);

  function availabilityFullFor(key: string) {
    const p = avail?.products.find((x) => x.key === key);
    return avail && p ? p.available < 1 : false;
  }

  const waLink = (text: string) =>
    `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`;

  const adjustToMinStay = () => {
    setCheckOut(addDaysISO(checkIn, minStay));
    setMinStayHit(false);
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    setMinStayHit(false);
    try {
      const utm: Record<string, string> = {};
      try {
        const sp = new URLSearchParams(window.location.search);
        for (const k of ["utm_source", "utm_medium", "utm_campaign"])
          if (sp.get(k)) utm[k] = sp.get(k)!;
      } catch {}
      const res = await submitBooking({
        accommodationKey: typeKey,
        checkIn,
        checkOut,
        guestName: name,
        guestEmail: email,
        guestPhone: phone,
        guestsCount: guests,
        paymentMethod: method,
        utm,
        honeypot,
      });
      if (!res.ok) {
        setError(res.error);
        if (res.minStay) setMinStayHit(true);
        return;
      }
      setResult(res);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <div className="rounded-3xl border border-line bg-paper p-8 md:p-12 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-mist flex items-center justify-center">
          <PartyPopper size={24} />
        </div>
        <h3 className="display-md mt-6">You&apos;re almost home.</h3>
        <p className="text-ink-soft mt-3 max-w-md mx-auto">
          {result.pricePending ? "Pre-booking request received" : "Booking request received"}. Your reference is
        </p>
        <p className="font-display font-extrabold text-3xl md:text-4xl tracking-tight mt-2 select-all">
          {result.reference}
        </p>
        <div className="grid sm:grid-cols-3 gap-3 mt-8 text-left max-w-2xl mx-auto">
          {[
            result.pricePending
              ? { icon: Wallet, title: "Get your price", text: "We'll message you on WhatsApp with your price and offers. Once agreed, pay from your booking page." }
              : { icon: Wallet, title: "Reserve with payment", text: `${pkr(result.totalPkr)} via your chosen method — details are on your booking page.` },
            { icon: ShieldCheck, title: "Verify your ID", text: "Upload CNIC / NICOP / passport — required for legal registration." },
            { icon: BadgeCheck, title: "Sign & check in", text: "Sign the stay agreement, then arrive and meet your people." },
          ].map((s) => (
            <div key={s.title} className="rounded-2xl bg-mist p-5">
              <s.icon size={18} />
              <p className="font-semibold mt-3 text-sm">{s.title}</p>
              <p className="text-xs text-ink-soft mt-1.5 leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {result.pricePending && whatsapp && (
            <a
              href={waLink(`Assalam-o-alaikum! My pre-booking reference is ${result.reference} (${product.name}, ${checkIn} to ${checkOut}).`)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              Chat on WhatsApp
            </a>
          )}
          <Link href={`/booking/${result.reference}`} className={result.pricePending && whatsapp ? "btn btn-outline" : "btn btn-primary"}>
            Open your booking portal <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
      <div className="rounded-3xl border border-line bg-paper p-6 md:p-8">
        {/* Accommodation choice */}
        <div className="grid sm:grid-cols-2 gap-3">
          {products.map((p) => {
            const full = availabilityFullFor(p.key);
            return (
              <button
                key={p.key}
                onClick={() => !full && setTypeKey(p.key)}
                disabled={full}
                className={cx(
                  "text-left rounded-2xl border p-5 transition-all duration-300",
                  typeKey === p.key
                    ? "border-ink bg-mist"
                    : "border-line hover:border-ink-soft",
                  full && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-center justify-between">
                  {p.key === "SHARED_BUNK" ? <BedDouble size={20} /> : <DoorOpen size={20} />}
                  {typeKey === p.key && (
                    <span className="w-5 h-5 rounded-full bg-ink text-paper flex items-center justify-center">
                      <Check size={12} />
                    </span>
                  )}
                </div>
                <p className="font-semibold mt-3">{p.name}</p>
                <p className="text-xs text-ink-soft mt-1 leading-relaxed">{p.tagline}</p>
                <p className="mt-3 text-sm font-semibold">
                  {hidePrices ? (
                    "Price on request"
                  ) : (
                    <>
                      {pkr(p.nightlyPkr)} <span className="font-normal text-ink-soft">/ night</span>
                    </>
                  )}
                </p>
                {avail && (
                  <p className="mt-1 text-[11.5px] tracking-wide uppercase text-ink-soft">
                    {full
                      ? "Full for these dates"
                      : `${avail.products.find((x) => x.key === p.key)?.available} of ${avail.products.find((x) => x.key === p.key)?.total} left`}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* Live availability calendar */}
        <div className="mt-4">
          <AvailabilityCalendar
            typeKey={typeKey}
            checkIn={checkIn}
            checkOut={checkOut}
            minStay={minStay}
            onPick={(a, b) => {
              setCheckIn(a);
              setCheckOut(b);
            }}
          />
        </div>

        {/* Dates */}
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div>
            <label className="label">Check-in</label>
            <input
              type="date"
              className="field"
              min={todayISO()}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Check-out</label>
            <input
              type="date"
              className="field"
              min={addDaysISO(checkIn || todayISO(), 1)}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
        </div>

        {tooShort && (
          <div className="mt-4 rounded-2xl bg-mist p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <p className="text-sm leading-relaxed">
              <span className="font-semibold">Good things take time.</span>{" "}
              <span className="text-ink-soft">
                Stay at least {minStay} nights and feel at home.
              </span>
            </p>
            <button onClick={adjustToMinStay} className="btn btn-outline !py-2.5 !px-5 text-sm shrink-0">
              Adjust to {minStay} nights
            </button>
          </div>
        )}
        {minStayHit && !tooShort && (
          <p className="mt-3 text-sm text-ink-soft">Minimum stay applied to your dates.</p>
        )}

        {/* Guests + method */}
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div>
            <label className="label">Guests</label>
            <select
              className="field"
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              disabled={typeKey === "SHARED_BUNK"}
            >
              {Array.from({ length: product.maxGuests }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "guest" : "guests"}
                </option>
              ))}
            </select>
            {typeKey === "SHARED_BUNK" && (
              <p className="text-[11.5px] text-ink-soft mt-1.5">
                One bunk hosts one person. Bring a friend? Book a second bunk too.
              </p>
            )}
          </div>
          <div className={hidePrices ? "hidden" : undefined}>
            <label className="label">Payment</label>
            <select className="field" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="RAAST">Raast instant transfer</option>
              <option value="CARD_LINK">Card payment link</option>
              <option value="CASH_ON_ARRIVAL">Cash on arrival (approval needed)</option>
            </select>
          </div>
        </div>

        {/* Guest details */}
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          <div>
            <label className="label">Full name</label>
            <input className="field" placeholder="As on your ID" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="field" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">WhatsApp number</label>
            <input className="field" placeholder="03xx xxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <input
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
        />

        <button
          onClick={submit}
          disabled={busy || tooShort || soldOut || nights < 1}
          className="btn btn-primary w-full mt-6 !py-4"
        >
          {busy ? (
            <>
              <Loader2 className="animate-spin" size={17} /> Securing your spot…
            </>
          ) : soldOut ? (
            "Full for these dates — choose the other option"
          ) : (
            <>
              {hidePrices ? "Send pre-booking request" : `Request booking ${quote ? `· ${pkr(quote.totalPkr)}` : ""}`}{" "}
              <ArrowRight size={16} />
            </>
          )}
        </button>
        {error && <p className="text-sm mt-3 text-center font-medium">{error}</p>}
        <p className="text-[12px] text-ink-soft text-center mt-3 leading-relaxed">
          {hidePrices
            ? "Nothing to pay now. We hold your spot as a pre-booking, share your price and offers on WhatsApp, and confirm once you pay."
            : "No card charged now. We hold your spot as a booking request, you pay by your chosen method, and we confirm — usually the same day."}
        </p>
      </div>

      {/* Summary */}
      <aside className="rounded-3xl bg-ink text-paper p-6 md:p-7 lg:sticky lg:top-24">
        <p className="kicker text-paper/60">Your stay</p>
        <h3 className="font-display font-bold text-2xl mt-2 tracking-tight">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 text-sm text-paper/70 mt-1.5">
          <CalendarDays size={14} />
          {checkIn} → {checkOut} · {nights > 0 ? `${nights} night${nights > 1 ? "s" : ""}` : "—"}
          {checking && <Loader2 size={12} className="animate-spin" />}
        </div>

        <div className="mt-6 space-y-3 border-t border-paper/15 pt-5 text-sm">
          {hidePrices ? (
            <div className="space-y-3">
              <p className="text-paper/80 leading-relaxed">
                Price on request. Send a pre-booking request and we&apos;ll share your
                price and any offers on WhatsApp.
              </p>
              {productAvail && (
                <p className="text-paper/70">
                  {productAvail.available > 0
                    ? `${productAvail.available} of ${productAvail.total} available for these dates`
                    : "Fully booked for these dates"}
                </p>
              )}
              {whatsapp && (
                <a
                  href={waLink(`Assalam-o-alaikum! I'm interested in a ${product.name} from ${checkIn} to ${checkOut} (${nights} nights).`)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn !bg-paper !text-ink w-full !py-3 text-sm"
                >
                  Ask on WhatsApp
                </a>
              )}
            </div>
          ) : quote ? (
            <>
              {quote.lines.map((l, i) => (
                <div key={i} className="flex justify-between gap-4">
                  <span className="text-paper/70 leading-snug">
                    {l.qty > 1 ? `${l.qty} × ` : ""}
                    {l.label}
                  </span>
                  <span className="shrink-0">{pkr(l.subtotalPkr)}</span>
                </div>
              ))}
              <div className="flex justify-between items-end pt-3 border-t border-paper/15">
                <span className="text-paper/70">Total</span>
                <span className="font-display font-extrabold text-3xl tracking-tight">
                  {pkr(quote.totalPkr)}
                </span>
              </div>
              {nights >= 7 && (
                <p className="text-[12px] text-paper/60">
                  Package pricing applied automatically — you never pay the raw
                  nightly rate on long stays.
                </p>
              )}
            </>
          ) : tooShort ? (
            <p className="text-paper/70 leading-relaxed">
              {minStay}-night minimum at the Colony. Add a couple of nights — the
              first dinner is on the community.
            </p>
          ) : (
            <p className="text-paper/70">Pick your dates to see package pricing.</p>
          )}
        </div>

        <ul className="mt-6 space-y-2 text-[13px] text-paper/70 border-t border-paper/15 pt-5">
          {[
            "Coworking lounge & fast Wi-Fi included",
            "Studio + call pod, bookable by slot",
            "Free community meetups",
            "25% resident discount on workshops",
          ].map((t) => (
            <li key={t} className="flex gap-2">
              <Check size={14} className="mt-0.5 shrink-0" /> {t}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
