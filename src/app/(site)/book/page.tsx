import type { Metadata } from "next";
import { getPublicEvents } from "@/lib/data";
import { getWhatsappNumber } from "@/lib/stays";
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
  searchParams: Promise<{ event?: string; stay?: string; room?: string }>;
}) {
  const sp = await searchParams;
  const today = todayISO();
  const [allEvents, whatsapp, member] = await Promise.all([
    getPublicEvents(),
    getWhatsappNumber(),
    getMember(),
  ]);
  const events = allEvents
    .filter((e) => e.status === "PUBLISHED" && (!e.startDate || (e.endDate ?? e.startDate) >= today))
    .map((e) => ({
      slug: e.slug,
      title: e.title,
      kind: e.kind,
      startDate: e.startDate,
      endDate: e.endDate,
      timeLabel: e.timeLabel,
      excerpt: e.excerpt,
      durationLabel: e.durationLabel,
      ticketPkr: e.ticketPkr,
      seatsLeft: Math.max(0, e.capacity - e.seatsTaken),
    }));
  const initialEvent = events.find((e) => e.slug === sp.event)?.slug;

  return (
    <div className="px-5 md:px-10 py-14 md:py-20">
      <div className="mx-auto max-w-3xl">
        <Reveal className="text-center">
          <p className="kicker text-ink-soft">Book</p>
          <h1 className="display-lg mt-4">
            Book now.
            <br />
            <span className="serif-em normal-case">Meet your people.</span>
          </h1>
          <p className="lede mt-5">
            Pick an event, a room, or both, and fill one short form. Our team calls you on
            WhatsApp to confirm.
          </p>
        </Reveal>
        <div className="mt-12">
          <PassBooking
            events={events}
            whatsapp={whatsapp}
            initialEvent={initialEvent}
            initialStay={sp.stay !== undefined}
            initialRoom={sp.room === "private" ? "Private Room" : sp.room === "bunker" ? "Bunker" : undefined}
            member={member ? { name: member.name, email: member.email, phone: member.phone ?? "" } : null}
          />
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
