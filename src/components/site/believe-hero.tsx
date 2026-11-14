import { ArrowDown, Lightbulb, Sparkles, Users } from "lucide-react";
import { IMG } from "@/lib/images";
import Reveal from "@/components/ui/reveal";

/** "We believe in you" hero + "Who lives here" band, shared by /stay and /book. */
export default function BelieveHero({
  primaryHref,
  primaryLabel,
  secondaryHref,
}: {
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
}) {
  return (
    <>
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
              <a href={primaryHref} className="btn btn-primary">
                {primaryLabel} <ArrowDown size={15} />
              </a>
              <a href={secondaryHref} className="btn btn-outline">
                See the rooms
              </a>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="img-frame rounded-3xl aspect-[4/5] lg:aspect-[4/4.6]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMG.creatorsHero} alt="Young creators together at Content Colony" className="w-full h-full object-cover" />
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
    </>
  );
}
