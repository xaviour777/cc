import type { Metadata } from "next";
import { getPublicEvents, getStayProducts } from "@/lib/data";
import { getHidePrices, getMinStayNights, getWhatsappNumber } from "@/lib/stays";
import { getMember } from "@/lib/members";
import Reveal from "@/components/ui/reveal";
import PassBooking from "@/components/booking/pass-booking";
import { todayISO } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Book a Pass — workshops, day passes and stays",
  description:
    "Book a Content Colony workshop pass (full or single day) in one simple form. Coming from another city? Stay with us.",
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const sp = await searchParams;
  const today = todayISO();
  const [allEvents, products, hidePrices, minStay, whatsapp, member] = await Promise.all([
    getPublicEvents(),
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
      endDate: e.endDate,
      timeLabel: e.timeLabel,
      excerpt: e.excerpt,
      tiers: e.passTiers ?? [],
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
            Book your pass.
            <br />
            <span className="serif-em normal-case">Meet your people.</span>
          </h1>
          <p className="lede mt-5">
            Pick a workshop, choose your pass (full or one day), fill one short form. Our team
            calls you on WhatsApp to confirm. No payment now.
          </p>
        </Reveal>
        <div className="mt-12">
          <PassBooking
            events={events}
            stays={stays}
            minStay={minStay}
            whatsapp={whatsapp}
            initialEvent={initialEvent}
            member={member ? { name: member.name, email: member.email, phone: member.phone ?? "" } : null}
          />
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
