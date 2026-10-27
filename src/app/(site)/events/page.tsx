import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { getPublicEvents } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import Reveal from "@/components/ui/reveal";
import EventCard from "@/components/site/event-card";

export const metadata: Metadata = {
  title: "Events & Workshops",
  description:
    "Workshops, meetups and community nights at Content Colony — YouTube automation, AI filmmaking, TikTok, editing, freelancing and more. Residents save 25%.",
};

export default async function EventsPage() {
  const events = await getPublicEvents();
  const workshops = events.filter((e) => e.kind === "WORKSHOP");
  const community = events.filter((e) => e.kind !== "WORKSHOP");

  return (
    <div className="px-5 md:px-10 py-14 md:py-20">
      <div className="mx-auto max-w-[1440px]">
        <Reveal className="max-w-3xl">
          <p className="kicker text-ink-soft">Events & workshops</p>
          <h1 className="display-xl mt-4">
            What&apos;s on at
            <br />
            the <span className="serif-em normal-case">Colony.</span>
          </h1>
          <p className="lede mt-5">
            Hands-on workshops, free meetups, gaming nights and dinners. Residents
            always pay less — the discount is verified against your stay.
          </p>
        </Reveal>

        {/* Workshops */}
        <Reveal className="mt-14 mb-6" delay={40}>
          <h2 className="display-md">Workshops</h2>
        </Reveal>
        <div className="grid md:grid-cols-2 gap-5">
          {workshops.map((e, i) => (
            <EventCard key={e.id} event={e} delay={i * 80} big={e.featured} />
          ))}
        </div>

        {/* Community calendar */}
        <Reveal className="mt-16 mb-6">
          <h2 className="display-md">Community calendar</h2>
        </Reveal>
        <div className="rounded-3xl border border-line overflow-hidden">
          {community.map((e, i) => (
            <Reveal key={e.id} delay={i * 50}>
              <Link
                href={`/events/${e.slug}`}
                className="group flex flex-wrap items-center gap-x-8 gap-y-2 p-6 border-b border-line last:border-0 hover:bg-mist transition-colors"
              >
                <div className="w-28 shrink-0">
                  <p className="font-display font-bold text-lg leading-none">
                    {e.startDate ? formatDate(e.startDate).split(" ").slice(0, 2).join(" ") : "TBA"}
                  </p>
                  <p className="text-[12px] text-ink-soft mt-1">{e.startDate ? formatDate(e.startDate).split(" ")[2] : "dates soon"}</p>
                </div>
                <div className="flex-1 min-w-52">
                  <p className="font-semibold">{e.title}</p>
                  <p className="text-sm text-ink-soft mt-0.5">
                    {e.venue} {e.timeLabel ? `· ${e.timeLabel}` : ""}
                  </p>
                </div>
                <span className="text-[11px] tracking-[0.14em] uppercase font-semibold bg-mist group-hover:bg-paper border border-line px-3 py-1.5 rounded-full transition-colors">
                  {e.ticketPkr === 0 ? "Free" : "Ticketed"}
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft group-hover:text-ink transition-colors">
                  <CalendarDays size={14} /> Details <ArrowRight size={14} />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-16">
          <div className="rounded-3xl bg-ink text-paper p-8 md:p-14 grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <p className="kicker text-paper/50">For creators & trainers</p>
              <h2 className="display-md mt-3">Teach something at the Colony.</h2>
              <p className="text-paper/60 mt-3 max-w-lg leading-relaxed">
                Run your workshop, meetup or screening in our space. Proposals go to
                the admin team — nothing goes public without approval.
              </p>
            </div>
            <Link href="/host-event" className="btn bg-paper text-ink hover:opacity-90">
              Host an Event <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
