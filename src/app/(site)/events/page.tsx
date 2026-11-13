import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clapperboard, Lightbulb, Repeat, Sunrise } from "lucide-react";
import { getPublicEvents } from "@/lib/data";
import Reveal from "@/components/ui/reveal";
import EventCard from "@/components/site/event-card";

export const metadata: Metadata = {
  title: "Events & Workshops",
  description:
    "Workshops, meetups and community nights at Content Colony — YouTube automation, AI filmmaking, TikTok, editing, freelancing and more. Residents save 25%.",
};

const RITUALS = [
  {
    day: "Friday",
    time: "Night",
    Icon: Clapperboard,
    title: "Friday Movie Premiere Night",
    desc: "Films made by our own community members, premiered on the big screen. Popcorn, applause and honest feedback.",
  },
  {
    day: "Saturday",
    time: "10 PM – 12 AM",
    Icon: Lightbulb,
    title: "Brainstorm Idea Session",
    desc: "Bring a half-baked idea, leave with a plan. Two hours of creators pushing each other's ideas further.",
  },
  {
    day: "Monday",
    time: "7 AM – 9 AM",
    Icon: Sunrise,
    title: "Morning Idea Session",
    desc: "Start the week with chai and fresh minds. Set your goals, share what you're building, get unstuck.",
  },
];

export default async function EventsPage() {
  const events = await getPublicEvents();
  const workshops = events.filter((e) => e.kind === "WORKSHOP");

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

        {/* Community calendar: weekly rituals, not one-off dates */}
        <Reveal className="mt-16 mb-6">
          <h2 className="display-md">Community calendar</h2>
          <p className="text-ink-soft mt-2">Every week at the Colony. Free for residents and the community.</p>
        </Reveal>
        <div className="rounded-3xl border border-line overflow-hidden">
          {RITUALS.map((r, i) => (
            <Reveal key={r.title} delay={i * 50}>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3 p-6 border-b border-line last:border-0">
                <div className="w-36 shrink-0">
                  <p className="font-display font-bold text-lg leading-none">Every {r.day}</p>
                  <p className="text-[12px] text-ink-soft mt-1.5">{r.time}</p>
                </div>
                <div className="flex-1 min-w-52">
                  <p className="font-semibold flex items-center gap-2">
                    <r.Icon size={16} /> {r.title}
                  </p>
                  <p className="text-sm text-ink-soft mt-1 leading-relaxed">{r.desc}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.14em] uppercase font-semibold bg-mist border border-line px-3 py-1.5 rounded-full">
                  <Repeat size={12} /> Weekly
                </span>
              </div>
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
