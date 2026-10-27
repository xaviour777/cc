import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ChefHat,
  Clapperboard,
  Gamepad2,
  Info,
  PhoneCall,
  Popcorn,
  Sofa,
  Users,
} from "lucide-react";
import { IMG } from "@/lib/images";
import { getPublicEvents } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import Reveal from "@/components/ui/reveal";
import ReelGrid from "@/components/site/reel-grid";
import { getSocialPosts } from "@/lib/data";

export const metadata: Metadata = {
  title: "Community & Entertainment — Life at the Colony",
  description:
    "Gaming nights, movie nights, weekend dinners, creator hangouts, studio sessions — this is what living at Content Colony feels like.",
};

export default async function CommunityPage() {
  const [events, reels] = await Promise.all([getPublicEvents(), getSocialPosts()]);
  const social = events.filter((e) => e.kind !== "WORKSHOP");

  return (
    <div>
      {/* Hero */}
      <section className="px-5 md:px-10 py-14 md:py-20">
        <div className="mx-auto max-w-[1440px]">
          <Reveal className="max-w-3xl">
            <p className="kicker text-ink-soft">Community & entertainment</p>
            <h1 className="display-xl mt-4">
              Life at
              <br />
              the <span className="serif-em normal-case">Colony.</span>
            </h1>
            <p className="lede mt-5">
              Work hard, play honestly. Everything here is part of your stay —
              hosted by residents, for residents. This is a home, not an arcade.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="img-frame rounded-[2rem] mt-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMG.gamingCouch} alt="A gaming night at the Colony" className="w-full h-[46vh] md:h-[60vh] object-cover" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Facilities */}
      <section className="px-5 md:px-10 pb-20">
        <div className="mx-auto max-w-[1440px] grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { Icon: Users, img: IMG.coworkLounge, t: "Coworking lounge", d: "Open all day, every day. Desks, chairs that don't hurt, plugs everywhere." },
            { Icon: Clapperboard, img: IMG.studioCrew, t: "Production studio", d: "Lights, backdrops, audio. Book a slot from your booking portal." },
            { Icon: PhoneCall, img: IMG.vlogMan, t: "Meeting / call pod", d: "A private booth for client calls, podcasts and interviews." },
            { Icon: Gamepad2, img: IMG.gamingDuo, t: "Gaming & entertainment", d: "Console + PC titles, GTA V free-roam nights, FIFA tournaments, party games." },
            { Icon: Popcorn, img: IMG.movieCozy, t: "Movie nights", d: "The projector, the beanbags, the weekly vote on what we watch." },
            { Icon: ChefHat, img: IMG.flatbread, t: "Kitchen & weekend dinners", d: "Cook for six, learn someone's paratha technique, repeat weekly." },
          ].map(({ Icon, img, t, d }, i) => (
            <Reveal key={t} delay={(i % 3) * 70}>
              <div className="rounded-3xl border border-line overflow-hidden bg-paper h-full card-lift">
                <div className="img-frame aspect-[16/10]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={t} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2.5">
                    <Icon size={17} />
                    <p className="font-semibold">{t}</p>
                  </div>
                  <p className="text-sm text-ink-soft mt-2 leading-relaxed">{d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-6">
          <p className="flex gap-2 text-[12.5px] text-ink-soft leading-relaxed rounded-2xl bg-mist p-4 max-w-3xl">
            <Info size={14} className="shrink-0 mt-0.5" />
            GTA VI joins our game shelf if and when it is legitimately released,
            licensed and supported on our platform — until then we proudly run
            licensed GTA V sessions. New games and gear are added by the team as
            the community asks for them.
          </p>
        </Reveal>
      </section>

      {/* This week */}
      <section className="bg-mist border-y border-line px-5 md:px-10 py-16 md:py-24">
        <div className="mx-auto max-w-[1440px]">
          <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <p className="kicker text-ink-soft">Entertainment calendar</p>
              <h2 className="display-lg mt-3">Happening soon.</h2>
            </div>
            <p className="text-ink-soft text-sm max-w-xs leading-relaxed">
              Residents see the calendar inside their booking portal — visitors can
              join community nights too.
            </p>
          </Reveal>
          <div className="rounded-3xl border border-line bg-paper overflow-hidden">
            {social.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.slug}`}
                className="group flex flex-wrap items-center gap-x-8 gap-y-2 p-6 border-b border-line last:border-0 hover:bg-mist transition-colors"
              >
                <p className="font-display font-bold w-32 shrink-0">
                  {e.startDate ? formatDate(e.startDate) : "TBA"}
                </p>
                <div className="flex-1 min-w-52">
                  <p className="font-semibold">{e.title}</p>
                  <p className="text-sm text-ink-soft mt-0.5">
                    {e.venue} {e.timeLabel ? `· ${e.timeLabel}` : ""}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft group-hover:text-ink transition-colors">
                  Join <ArrowUpRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Reels */}
      <section className="px-5 md:px-10 py-16 md:py-24">
        <div className="mx-auto max-w-[1440px]">
          <Reveal className="mb-10">
            <p className="kicker text-ink-soft">Creator reels</p>
            <h2 className="display-lg mt-3">Made at the Colony.</h2>
          </Reveal>
          <ReelGrid posts={reels} />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink text-paper px-5 md:px-10 py-20 md:py-28 text-center">
        <div className="mx-auto max-w-2xl">
          <Reveal>
            <Sofa className="mx-auto text-paper/50" size={22} />
            <h2 className="display-lg mt-5">The couch has a spot with your name on it.</h2>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <Link href="/stay#book" className="btn bg-paper text-ink hover:opacity-90">
                Find Your Stay <ArrowRight size={15} />
              </Link>
              <Link href="/events" className="btn border border-paper/30 text-paper hover:border-paper">
                See events
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
