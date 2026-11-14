import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartHandshake, Sparkles } from "lucide-react";
import { IMG } from "@/lib/images";
import Reveal from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "About — why Content Colony exists",
  description: "The story behind Lahore's creator co-living community — and how we keep it warm.",
};

export default async function AboutPage() {
  return (
    <div className="px-5 md:px-10 py-14 md:py-20">
      <div className="mx-auto max-w-[1440px]">
        <Reveal className="max-w-3xl">
          <p className="kicker text-ink-soft">About</p>
          <h1 className="display-xl mt-4">
            Come as a stranger.
            <br />
            <span className="serif-em normal-case">Create as a friend.</span>
          </h1>
        </Reveal>
        <Reveal delay={120}>
          <div className="img-frame rounded-[2rem] mt-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG.dinnerWide} alt="The Colony at dinner" className="w-full h-[46vh] md:h-[58vh] object-cover" />
          </div>
        </Reveal>

        <div className="grid lg:grid-cols-2 gap-12 mt-16 md:mt-24 max-w-5xl mx-auto">
          <Reveal>
            <h2 className="display-md">Why we exist</h2>
          </Reveal>
          <Reveal delay={80} className="space-y-5 text-ink-soft leading-relaxed">
            <p>
              Pakistan&apos;s creator economy is exploding, but the people building it
              mostly work alone — from bedrooms, between power bills and deadlines.
              Talent was never the gap. Proximity was.
            </p>
            <p>
              Content Colony puts creators under one roof in Johar Town, Lahore:
              a place to sleep honestly priced, a lounge to work from, a studio to
              shoot in, and a dinner table where your next collaborator is already
              sitting. Workshops keep everyone levelling up; community nights keep
              everyone human.
            </p>
            <p>
              We keep it small on purpose. Eight bunks, four private rooms, one studio —
              because community doesn&apos;t scale by headcount, it scales by trust.
            </p>
          </Reveal>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-16 max-w-3xl mx-auto">
          {[
            { Icon: HeartHandshake, t: "Community-first", d: "Every decision starts with 'does this bring people closer?'" },
            { Icon: Sparkles, t: "Craft over clout", d: "We celebrate finished work, not follower counts." },
          ].map(({ Icon, t, d }, i) => (
            <Reveal key={t} delay={i * 70}>
              <div className="rounded-3xl bg-mist p-6 h-full">
                <Icon size={20} />
                <p className="font-semibold mt-4">{t}</p>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="text-center mt-20">
          <h2 className="display-lg">
            Your people are <span className="serif-em normal-case">here.</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Link href="/stay" className="btn btn-primary">
              Find Your Stay <ArrowRight size={15} />
            </Link>
            <Link href="/contact" className="btn btn-outline">Say salam first</Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
