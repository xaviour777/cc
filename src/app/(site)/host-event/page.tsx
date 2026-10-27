import type { Metadata } from "next";
import { Check } from "lucide-react";
import { IMG } from "@/lib/images";
import Reveal from "@/components/ui/reveal";
import ProposalForm from "@/components/forms/proposal-form";

export const metadata: Metadata = {
  title: "Host an Event",
  description:
    "Propose a workshop, meetup or screening at Content Colony. No account needed — our admin team reviews every proposal.",
};

export default function HostEventPage() {
  return (
    <div className="px-5 md:px-10 py-14 md:py-20">
      <div className="mx-auto max-w-[1440px] grid lg:grid-cols-2 gap-12 items-start">
        <div className="lg:sticky lg:top-24">
          <Reveal>
            <p className="kicker text-ink-soft">Host an Event</p>
            <h1 className="display-lg mt-4">
              Teach it at
              <br />
              the <span className="serif-em normal-case">Colony.</span>
            </h1>
            <p className="lede mt-5">
              Creators, trainers, brands, organizers — if you have something worth
              teaching, we have the room, the studio and the audience.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <ul className="mt-8 space-y-3">
              {[
                "Submit without an account — proposals go straight to our team",
                "Only admin-approved events are ever published",
                "If approved, we handle listings, tickets and resident discounts",
                "Coworking lounge, studio and call pod available to hosts",
              ].map((t) => (
                <li key={t} className="flex gap-3 text-[15px] text-ink-soft leading-relaxed">
                  <Check size={16} className="shrink-0 mt-1" /> {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={150}>
            <div className="img-frame rounded-3xl aspect-[16/10] mt-10 hidden lg:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMG.coworkAlt} alt="A workshop at the Colony" loading="lazy" className="w-full h-full object-cover" />
            </div>
          </Reveal>
        </div>
        <Reveal delay={120}>
          <ProposalForm />
        </Reveal>
      </div>
    </div>
  );
}
