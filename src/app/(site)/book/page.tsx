import type { Metadata } from "next";
import { getPublicEvents, getStayProducts } from "@/lib/data";
import { getHidePrices, getMinStayNights, getSetting, getWhatsappNumber } from "@/lib/stays";
import { getMember } from "@/lib/members";
import Reveal from "@/components/ui/reveal";
import PassBooking from "@/components/booking/pass-booking";
import { todayISO } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Book — day pass, workshop pass or stay",
  description:
    "Book a Community Day Pass or a workshop / event pass at Content Colony in one simple form. Coming from another city? Stay with us for 3 nights.",
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const today = todayISO();
  const [allEvents, dayPassPkr, products, hidePrices, minStay, whatsapp, member] = await Promise.all([
    getPublicEvents(),
    getSetting<number>("dayPassPkr", 0),
    getStayProducts(),
    getHidePrices(),
    getMinStayNights(),
    getWhatsappNumber(),
    getMember(),
  ]);
  const events = allEvents
    .filter((e) => e.status === "PUBLISHED" && (!e.startDate || e.startDate >= today))
    .map((e) => ({
      slug: e.slug,
      title: e.title,
      kind: e.kind,
      startDate: e.startDate,
      timeLabel: e.timeLabel,
      ticketPkr: e.ticketPkr,
      seatsLeft: Math.max(0, e.capacity - e.seatsTaken),
    }));
  const stays = products.map((p) => ({
    key: p.key,
    name: p.name,
    nightlyPkr: hidePrices ? 0 : p.nightlyPkr,
    weeklyPkr: hidePrices ? null : p.weeklyPkr,
  }));
  const initialEvent = events.find((e) => e.slug === sp.event)?.slug;

  return (
    <div className="px-5 md:px-10 py-14 md:py-20">
      <div className="mx-auto max-w-3xl">
        <Reveal className="text-center">
          <p className="kicker text-ink-soft">Book</p>
          <h1 className="display-lg mt-4">
            Come spend a day
            <br />
            <span className="serif-em normal-case">with your people.</span>
          </h1>
          <p className="lede mt-5">
            Pick a pass, fill one short form, and our team will call or WhatsApp you to
            confirm. No account, no payment online.
          </p>
        </Reveal>
        <div className="mt-12">
          <PassBooking
            events={events}
            dayPassPkr={Number(dayPassPkr) || 0}
            stays={stays}
            minStay={minStay}
            whatsapp={whatsapp}
            initialKind={initialEvent ? "EVENT" : sp.type === "day" ? "DAY_PASS" : null}
            initialEvent={initialEvent}
            member={member ? { name: member.name, email: member.email, phone: member.phone ?? "" } : null}
          />
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
