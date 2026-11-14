import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  BedDouble,
  DoorOpen,
  Lightbulb,
  Sparkles,
  Users,
} from "lucide-react";
import { IMG } from "@/lib/images";
import { getMinStayNights, getWhatsappNumber } from "@/lib/stays";
import { getMember } from "@/lib/members";
import Reveal from "@/components/ui/reveal";
import StayRequest from "@/components/booking/stay-request";

export const metadata: Metadata = {
  title: "Live at the Colony — request your stay",
  description:
    "Content Colony is a home for creators who believe they can build something. From any city — request to live with us in the Bunker or a Private Room.",
};

const ROOMS = [
  {
    key: "Bunker" as const,
    Icon: BedDouble,
    label: "Shared living · 8 bunks",
    name: "The Bunker",
    image: IMG.bunkRoom,
    line: "Your own bunk in a room full of people who are building something too.",
    perks: [
      "A private-feeling bunk with curtain, reading light, shelf and locker",
      "Late-night edits, early-morning ideas, and a room that gets it",
      "The whole colony is yours: lounge, studio, kitchen, community nights",
    ],
  },
  {
    key: "Private Room" as const,
    Icon: DoorOpen,
    label: "Private living · 4 rooms",
    name: "Private Room",
    image: IMG.privateRoom,
    line: "A quiet room of your own, with the colony right outside your door.",
    perks: [
      "Your own lockable room for deep work and deep sleep",
      "Coworking lounge, production studio and soundproof meeting pod",
      "Kitchen, lounge, entertainment area and every community night",
    ],
  },
];

export default async function StayPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const sp = await searchParams;
  const [whatsapp, minStay, member] = await Promise.all([getWhatsappNumber(), getMinStayNights(), getMember()]);
  const initialRoom = sp.room === "private" ? "Private Room" : "Bunker";

  return (
    <div>
      {/* ---------- HERO ---------- */}
      <section className="px-5 md:px-10 pt-14 md:pt-20 pb-16 md:pb-24">
        <div className="mx-auto max-w-[1440px] grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-center">
          <Reveal>
            <p className="kicker text-ink-soft">Live at the Colony · by request</p>
            <h1 className="display-xl mt-4">
              We believe
              <br />
              <span className="serif-em normal-case">in you.</span>
            </h1>
            <p className="lede mt-6 max-w-xl">
              If you&apos;re a creator, from any city, and you believe you can build something real, there&apos;s a bed
              here with your name on it.
            </p>
            <p className="text-ink-soft mt-4 max-w-xl leading-relaxed">
              Eight bunks. Four private rooms. One table full of people who will push you, cheer for
              you, and stay up past midnight helping you finish the thing.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <a href="#request" className="btn btn-primary">
                Request to live here <ArrowDown size={15} />
              </a>
              <a href="#rooms" className="btn btn-outline">
                See the rooms
              </a>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="img-frame rounded-3xl aspect-[4/5] lg:aspect-[4/4.6]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMG.bunkSocial} alt="Creators living together at Content Colony" className="w-full h-full object-cover" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- WHO IT'S FOR ---------- */}
      <section className="bg-ink text-paper px-5 md:px-10 py-16 md:py-24">
        <div className="mx-auto max-w-[1440px]">
          <Reveal className="max-w-3xl">
            <p className="kicker text-paper/50">Who lives here</p>
            <h2 className="display-lg mt-3">
              Not everyone. <span className="serif-em normal-case">The ones who are building.</span>
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-4 mt-10">
            {[
              { Icon: Lightbulb, t: "You have an idea that won't leave you alone", d: "A channel, a film, a brand, a startup. It doesn't need to be big yet. It needs you." },
              { Icon: Users, t: "You're tired of building alone", d: "Here, the person in the next bunk is editing too. Collabs happen over chai, not cold DMs." },
              { Icon: Sparkles, t: "You'll give as much as you take", d: "Share what you know, show up to the sessions, and lift the next creator who walks in." },
            ].map(({ Icon, t, d }, i) => (
              <Reveal key={t} delay={i * 80}>
                <div className="rounded-3xl bg-paper/[0.06] border border-paper/10 p-6 md:p-7 h-full">
                  <Icon size={20} />
                  <p className="font-semibold mt-4">{t}</p>
                  <p className="text-sm text-paper/65 mt-2 leading-relaxed">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- ROOMS ---------- */}
      <section id="rooms" className="scroll-mt-24 px-5 md:px-10 py-16 md:py-24">
        <div className="mx-auto max-w-[1440px]">
          <Reveal className="max-w-2xl">
            <p className="kicker text-ink-soft">Your corner of the Colony</p>
            <h2 className="display-lg mt-3">Choose where you&apos;ll create.</h2>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-5 mt-10">
            {ROOMS.map((r, i) => (
              <Reveal key={r.key} delay={i * 90}>
                <article className="rounded-3xl border border-line overflow-hidden bg-paper h-full flex flex-col">
                  <div className="img-frame aspect-[16/10]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.image} alt={r.name} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-6 md:p-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-ink-soft">
                      <r.Icon size={17} />
                      <span className="text-[12px] tracking-[0.16em] uppercase font-medium">{r.label}</span>
                    </div>
                    <h3 className="font-display font-bold text-2xl md:text-3xl mt-2 tracking-tight">{r.name}</h3>
                    <p className="text-ink-soft mt-2 leading-relaxed text-[15px]">{r.line}</p>
                    <ul className="mt-5 space-y-2">
                      {r.perks.map((f) => (
                        <li key={f} className="flex gap-2.5 text-sm text-ink-soft">
                          <BadgeCheck size={15} className="shrink-0 mt-0.5 text-ink" /> {f}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-6">
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-line">
                        <p className="font-display font-bold text-lg tracking-tight">Your spot is waiting</p>
                        <Link
                          href={`/stay?room=${r.key === "Bunker" ? "bunker" : "private"}#request`}
                          scroll={false}
                          className="btn btn-primary !py-2.5 !px-5 text-sm"
                        >
                          Book now <ArrowRight size={15} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- REQUEST ---------- */}
      <section id="request" className="scroll-mt-24 px-5 md:px-10 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <StayRequest key={initialRoom} initialRoom={initialRoom} whatsapp={whatsapp} minStay={minStay} member={member ? { name: member.name, email: member.email, phone: member.phone ?? "" } : null} />
        </div>
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
