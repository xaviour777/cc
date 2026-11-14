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
import BelieveHero from "@/components/site/believe-hero";

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
      <BelieveHero primaryHref="#request" primaryLabel="Request to live here" secondaryHref="#rooms" />

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
