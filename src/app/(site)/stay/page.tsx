import type { Metadata } from "next";
import {
  ArrowDown,
  BadgeCheck,
  BadgePercent,
  BedDouble,
  CalendarDays,
  DoorOpen,
  ShieldCheck,
} from "lucide-react";
import { getAccommodationTypes, getStayProducts } from "@/lib/data";
import { getHidePrices, getMinStayNights, getSetting, getWhatsappNumber } from "@/lib/stays";
import { pkr } from "@/lib/utils";
import { IMG } from "@/lib/images";
import Reveal from "@/components/ui/reveal";
import BookingWidget from "@/components/booking/booking-widget";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { beds, ratePlans, rooms } from "@/db/schema";

export const metadata: Metadata = {
  title: "Stay — bunks, private rooms and honest prices",
  description:
    "Shared bunks and private rooms in Johar Town, Lahore. Check live availability on the calendar and send a booking request. Minimum 3 nights.",
};

export default async function StayPage() {
  const [listedProducts, types, minStay, discount, listedPlans, hidePrices, whatsapp, roomRows, bedRows] = await Promise.all([
    getStayProducts(),
    getAccommodationTypes(),
    getMinStayNights(),
    getSetting<number>("residentDiscountPct", 25),
    db.select().from(ratePlans).where(eq(ratePlans.active, true)),
    getHidePrices(),
    getWhatsappNumber(),
    db.select().from(rooms).where(eq(rooms.active, true)),
    db.select().from(beds).where(eq(beds.active, true)),
  ]);
  // In "price on request" mode no price ever reaches the page.
  const products = hidePrices
    ? listedProducts.map((p) => ({ ...p, nightlyPkr: 0, weeklyPkr: null, monthlyPkr: null }))
    : listedProducts;
  const plans = hidePrices ? [] : listedPlans;
  const sharedRoomIds = new Set(roomRows.filter((r) => r.type === "SHARED_BUNK").map((r) => r.id));
  const bunkCount = bedRows.filter((b) => sharedRoomIds.has(b.roomId)).length;
  const privateCount = roomRows.filter((r) => r.type === "PRIVATE_ROOM").length;

  return (
    <div className="px-5 md:px-10 py-14 md:py-20">
      <div className="mx-auto max-w-[1440px]">
        <Reveal className="text-center max-w-3xl mx-auto">
          <p className="kicker text-ink-soft">Stay</p>
          <h1 className="display-xl mt-4">
            Sleep well.
            <br />
            <span className="serif-em normal-case">Build all day.</span>
          </h1>
          <p className="lede mt-5">
            {hidePrices
              ? `Stays start at ${minStay} nights. Check live availability below and send a pre-booking request — we share your price and offers on WhatsApp.`
              : `Prices are per night, stays start at ${minStay} nights, and longer stays get package pricing automatically — never the raw nightly maths.`}
          </p>
          <a href="#book" className="btn btn-primary mt-8">
            Check real availability <ArrowDown size={15} />
          </a>
        </Reveal>

        {/* Accommodation cards */}
        <div className="grid md:grid-cols-2 gap-5 mt-16">
          {types.map((t, i) => {
            const p = products.find((x) => x.key === t.key)!;
            return (
              <Reveal key={t.id} delay={i * 90}>
                <article className="rounded-3xl border border-line overflow-hidden bg-paper">
                  <div className="img-frame aspect-[16/9]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-6 md:p-8">
                    <div className="flex items-center gap-2 text-ink-soft">
                      {t.key === "SHARED_BUNK" ? <BedDouble size={17} /> : <DoorOpen size={17} />}
                      <span className="text-[12px] tracking-[0.16em] uppercase font-medium">
                        {t.key === "SHARED_BUNK" ? `Shared living · ${bunkCount} bunks` : `Private accommodation · ${privateCount} rooms`}
                      </span>
                    </div>
                    <h2 className="font-display font-bold text-2xl md:text-3xl mt-2 tracking-tight">{t.name}</h2>
                    <p className="text-ink-soft mt-3 leading-relaxed text-[15px]">{t.description}</p>
                    <ul className="mt-5 space-y-2">
                      {t.features.map((f) => (
                        <li key={f} className="flex gap-2.5 text-sm text-ink-soft">
                          <BadgeCheck size={15} className="shrink-0 mt-0.5 text-ink" /> {f}
                        </li>
                      ))}
                    </ul>
                    {hidePrices ? (
                    <div className="mt-6 pt-5 border-t border-line">
                      <p className="font-display font-bold text-xl tracking-tight">Price on request</p>
                      <p className="text-sm text-ink-soft mt-1">Custom offers on WhatsApp · {minStay}-night minimum</p>
                    </div>
                    ) : (
                    <div className="mt-6 pt-5 border-t border-line">
                      <p>
                        <span className="font-display font-extrabold text-3xl tracking-tight">{pkr(p.nightlyPkr)}</span>
                        <span className="text-ink-soft"> / {t.key === "SHARED_BUNK" ? "person / night" : "room / night"}</span>
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {plans
                          .filter((pl) => pl.accommodationTypeId === t.id)
                          .sort((a, b) => a.unitNights - b.unitNights)
                          .map((pl) => (
                            <span key={pl.id} className="text-[12px] bg-mist rounded-full px-3 py-1.5">
                              {pl.unitNights === 1
                                ? `${minStay}-night minimum`
                                : `${pl.unitNights} nights · ${pkr(pl.pricePkr)}`}
                            </span>
                          ))}
                      </div>
                    </div>
                    )}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        {/* Booking widget */}
        <Reveal className="mt-16" delay={60}>
          <div id="book" className="scroll-mt-28">
            <div className="text-center max-w-xl mx-auto mb-8">
              <p className="kicker text-ink-soft">Book your stay</p>
              <h2 className="display-md mt-3">{hidePrices ? "Real beds. Real dates." : "Real beds. Real dates. Real price."}</h2>
              <p className="text-ink-soft mt-3 text-[15px] leading-relaxed">
                Availability below is live — a bed is locked to you the moment your
                request lands, so nobody can double-book it.
              </p>
            </div>
            <BookingWidget products={products} minStay={minStay} hidePrices={hidePrices} whatsapp={whatsapp} />
          </div>
        </Reveal>

        {/* How it works */}
        <div className="grid sm:grid-cols-3 gap-4 mt-16">
          {[
            { Icon: CalendarDays, t: "1 · Request & pay", d: "Pick dates, choose bank transfer, Raast, card link or approved cash on arrival." },
            { Icon: ShieldCheck, t: "2 · Verify your ID", d: "Upload CNIC / NICOP / passport from your booking portal. It stays private, admin-only." },
            { Icon: BadgePercent, t: "3 · Live the Colony", d: `Sign your stay agreement, check in, and unlock ${discount}% off every workshop.` },
          ].map(({ Icon, t, d }, i) => (
            <Reveal key={t} delay={i * 80}>
              <div className="rounded-3xl bg-mist p-6 md:p-7 h-full">
                <Icon size={20} />
                <p className="font-semibold mt-4">{t}</p>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-14">
          <div className="rounded-3xl overflow-hidden border border-line grid md:grid-cols-2">
            <div className="img-frame aspect-[4/3] md:aspect-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMG.bunkSocial} alt="Residents in a shared room" loading="lazy" className="w-full h-full object-cover" />
            </div>
            <div className="p-8 md:p-12 flex flex-col justify-center bg-mist">
              <p className="kicker text-ink-soft">House notes</p>
              <h3 className="display-md mt-3">Good things take time.</h3>
              <p className="text-ink-soft mt-4 leading-relaxed">
                The {minStay}-night minimum isn&apos;t a rule for rule&apos;s sake — it&apos;s
                how a stranger becomes a friend before they leave. Community dinners,
                studio slots, call pod and meetups are all included in every stay.
              </p>
              <p className="text-[12.5px] text-ink-soft mt-4">
                Identity verification (CNIC / NICOP / passport) is a legal requirement
                for overnight guests in Punjab. Documents are stored privately and
                only visible to authorized administration.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
