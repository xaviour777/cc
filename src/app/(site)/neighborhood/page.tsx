import type { Metadata } from "next";
import { Coffee, Landmark, MapPin, Navigation, ShoppingBag, Train, Utensils } from "lucide-react";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { IMG } from "@/lib/images";
import { getSetting } from "@/lib/stays";
import Reveal from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Around the Colony — Johar Town, Lahore",
  description:
    "The Colony's neighbourhood: Expo Centre Lahore, Emporium Mall, Canal Road, food streets, cafés and transport — part of the creator living experience.",
};

export default async function NeighborhoodPage() {
  const [property] = await db.select().from(properties).limit(1);
  const addressApproved = property?.addressApproved && property.address;

  return (
    <div className="px-5 md:px-10 py-14 md:py-20">
      <div className="mx-auto max-w-[1440px]">
        <Reveal className="max-w-3xl">
          <p className="kicker text-ink-soft">Around the Colony</p>
          <h1 className="display-xl mt-4">
            Our corner of
            <br />
            <span className="serif-em normal-case">Lahore.</span>
          </h1>
          <p className="lede mt-5">
            {property?.neighborhood ?? "Johar Town, H Block"} — close enough to
            everything that your lunch break can become a field trip.*
          </p>
          <p className="text-[12px] text-ink-soft mt-3">
            *Specific walking times are verified against our confirmed map pin before
            we publish any exact claim.
          </p>
        </Reveal>

        <div className="grid lg:grid-cols-2 gap-6 mt-12 items-start">
          {/* Map */}
          <Reveal>
            <div className="rounded-3xl overflow-hidden border border-line bg-mist">
              <iframe
                title="Content Colony — Johar Town, Lahore"
                src={property?.mapEmbedUrl ?? "https://www.google.com/maps?q=Johar%20Town%20H%20Block%20Lahore%20Pakistan&output=embed"}
                className="w-full aspect-[4/3] grayscale contrast-105"
                loading="lazy"
              />
              <div className="p-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ink-soft">
                  {addressApproved ? property.address : "Johar Town, H Block — exact address shared with confirmed guests."}
                </p>
                {property?.mapDirectionsUrl && (
                  <a href={property.mapDirectionsUrl} target="_blank" rel="noreferrer" className="btn btn-outline !py-2.5 !px-4 text-sm">
                    <Navigation size={14} /> Directions
                  </a>
                )}
              </div>
            </div>
          </Reveal>

          {/* Landmarks */}
          <div className="space-y-4">
            {[
              { Icon: Landmark, name: "Expo Centre Lahore", note: "Exhibitions, expos and job fairs on the doorstep — roughly a five-minute walk*." },
              { Icon: ShoppingBag, name: "Emporium Mall", note: "Groceries, cinema, food court and every errand in one building — about five minutes on foot*." },
              { Icon: Navigation, name: "Canal Road", note: "The city's spine — rickshaws, ride-hailing and buses in both directions." },
              { Icon: Utensils, name: "Food streets & late chai", note: "Karahi joints, BBQ, samosa carts and dhaba chai within the block radius." },
              { Icon: Coffee, name: "Cafés", note: "Work-friendly cafés for when you want to see different walls." },
              { Icon: Train, name: "Getting around", note: "Careem / inDrive in minutes, bus routes on Canal Road, essentials walkable." },
            ].map(({ Icon, name, note }, i) => (
              <Reveal key={name} delay={i * 50}>
                <div className="flex gap-4 rounded-2xl border border-line bg-paper p-5 items-start">
                  <span className="w-10 h-10 rounded-full bg-mist flex items-center justify-center shrink-0">
                    <Icon size={17} />
                  </span>
                  <div>
                    <p className="font-semibold">{name}</p>
                    <p className="text-sm text-ink-soft mt-1 leading-relaxed">{note}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal className="mt-14">
          <div className="grid md:grid-cols-[1fr_1fr] gap-5 rounded-3xl overflow-hidden border border-line">
            <div className="img-frame aspect-[16/10] md:aspect-auto min-h-64">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMG.lahoreVendor} alt="Street vendor in Lahore" loading="lazy" className="w-full h-full object-cover" />
            </div>
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <MapPin size={20} className="text-ink-soft" />
              <h2 className="display-md mt-4">The city is the syllabus.</h2>
              <p className="text-ink-soft mt-4 leading-relaxed">
                Content ideas live on these streets — the juice vendor with perfect
                b-roll, the market at golden hour, the chai dhaba at 1 AM. Staying
                here means Lahore becomes part of what you make.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
