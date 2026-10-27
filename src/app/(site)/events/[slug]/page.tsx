import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgePercent,
  CalendarDays,
  Check,
  Clock3,
  Info,
  MapPin,
  Users,
} from "lucide-react";
import { getEventBySlug } from "@/lib/data";
import { getSetting } from "@/lib/stays";
import { db } from "@/db";
import { and, eq, ne, sql } from "drizzle-orm";
import { articles, articleTranslations } from "@/db/schema";
import { formatDate, pkr } from "@/lib/utils";
import Reveal from "@/components/ui/reveal";
import EventRegisterForm from "@/components/events/register-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event not found" };
  return {
    title: event.title,
    description: event.excerpt,
    openGraph: { images: event.image ? [event.image] : [] },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event || event.status === "DRAFT" || event.status === "CANCELLED") notFound();

  const discount = event.residentDiscountPct ?? (await getSetting<number>("residentDiscountPct", 25));
  const seatsLeft = Math.max(0, event.capacity - event.seatsTaken);
  const pctTaken = Math.min(100, Math.round((event.seatsTaken / Math.max(1, event.capacity)) * 100));

  const related = await db
    .select({ t: articleTranslations, a: articles })
    .from(articles)
    .innerJoin(
      articleTranslations,
      and(eq(articleTranslations.articleId, articles.id), eq(articleTranslations.lang, "en"))
    )
    .where(and(eq(articles.relatedEventSlug, slug), ne(articles.status, "DRAFT")))
    .limit(3);

  const siteUrl = process.env.SITE_URL ?? "";
  const shareUrl = `${siteUrl}/events/${event.slug}`;
  const dateLabel = event.startDate
    ? `${formatDate(event.startDate)}${event.endDate && event.endDate !== event.startDate ? ` – ${formatDate(event.endDate)}` : ""}`
    : null;

  return (
    <div className="px-5 md:px-10 py-10 md:py-14">
      <div className="mx-auto max-w-[1440px]">
        <Link href="/events" className="u-link inline-flex items-center gap-2 text-sm text-ink-soft">
          <ArrowLeft size={15} /> All events
        </Link>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8 mt-6 items-start">
          <div>
            <Reveal>
              <p className="kicker text-ink-soft">{event.category}</p>
              <h1 className="display-lg mt-3">{event.title}</h1>
              <p className="lede mt-4 max-w-2xl">{event.excerpt}</p>
            </Reveal>

            {event.hostName && (
              <Reveal delay={80}>
                <div className="flex items-center gap-4 mt-7 rounded-2xl border border-line p-4 bg-paper max-w-md">
                  {event.hostImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={event.hostImage}
                      alt={event.hostName}
                      className="w-14 h-14 rounded-full object-cover grayscale"
                    />
                  ) : (
                    <span className="w-14 h-14 rounded-full bg-mist flex items-center justify-center font-display font-bold text-lg">
                      {event.hostName.slice(0, 1)}
                    </span>
                  )}
                  <div>
                    <p className="font-semibold">{event.hostName}</p>
                    <p className="text-sm text-ink-soft">{event.hostRole}</p>
                  </div>
                </div>
              </Reveal>
            )}

            <Reveal delay={120}>
              <div className="img-frame rounded-3xl aspect-[21/10] mt-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={event.image ?? ""} alt={event.title} className="w-full h-full object-cover" />
              </div>
            </Reveal>

            <Reveal className="prose-colony mt-10 max-w-3xl">
              {event.description.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </Reveal>

            {event.outcomes.length > 0 && (
              <Reveal className="mt-10">
                <h2 className="display-md">What you&apos;ll walk away with</h2>
                <div className="grid sm:grid-cols-2 gap-3 mt-6">
                  {event.outcomes.map((o) => (
                    <div key={o} className="flex gap-3 rounded-2xl bg-mist p-4">
                      <Check size={16} className="shrink-0 mt-0.5" />
                      <p className="text-sm leading-relaxed">{o}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            )}

            {event.schedule.length > 0 && (
              <Reveal className="mt-10">
                <h2 className="display-md">The {event.schedule.length > 1 ? `${event.schedule.length}-day ` : ""}schedule</h2>
                <div className="mt-6 space-y-3">
                  {event.schedule.map((s, i) => (
                    <div key={i} className="grid sm:grid-cols-[120px_1fr] gap-2 sm:gap-6 rounded-2xl border border-line p-5">
                      <p className="font-display font-bold text-sm tracking-wide uppercase text-ink-soft">{s.day}</p>
                      <div>
                        <p className="font-semibold">{s.title}</p>
                        <p className="text-sm text-ink-soft mt-1 leading-relaxed">{s.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            )}

            {related.length > 0 && (
              <Reveal className="mt-10">
                <h2 className="display-md">From the Journal</h2>
                <div className="mt-5 space-y-3">
                  {related.map((r) => (
                    <Link
                      key={r.t.id}
                      href={`/journal/${r.t.slug}`}
                      className="group flex items-center justify-between rounded-2xl border border-line p-5 hover:bg-mist transition-colors"
                    >
                      <div>
                        <p className="font-semibold">{r.t.title}</p>
                        <p className="text-sm text-ink-soft mt-0.5 line-clamp-1">{r.t.excerpt}</p>
                      </div>
                      <ArrowUpRight size={17} className="shrink-0 text-ink-soft group-hover:text-ink transition-colors" />
                    </Link>
                  ))}
                </div>
              </Reveal>
            )}
          </div>

          {/* Booking rail */}
          <aside className="lg:sticky lg:top-24 space-y-4">
            <Reveal>
              <div className="rounded-3xl border border-line bg-paper overflow-hidden">
                <div className="bg-ink text-paper p-6">
                  <p className="kicker text-paper/50">{event.kind === "WORKSHOP" ? "Workshop" : "Community event"}</p>
                  <p className="font-display font-extrabold text-3xl tracking-tight mt-2">
                    {event.ticketPkr > 0 ? pkr(event.ticketPkr) : "Free"}
                  </p>
                  {event.ticketPkr > 0 && (
                    <p className="text-paper/60 text-[13px] mt-1.5 inline-flex items-center gap-1.5">
                      <BadgePercent size={13} /> Residents pay {pkr(Math.round((event.ticketPkr * (100 - discount) / 100)))} ({discount}% off)
                    </p>
                  )}
                </div>
                <div className="p-6 space-y-3 text-sm">
                  <p className="flex items-center gap-2.5">
                    <CalendarDays size={15} className="text-ink-soft shrink-0" />
                    {dateLabel ?? "Dates announced soon — register interest now"}
                  </p>
                  {event.durationLabel && (
                    <p className="flex items-center gap-2.5">
                      <Clock3 size={15} className="text-ink-soft shrink-0" />
                      {event.durationLabel}
                      {event.timeLabel ? ` · ${event.timeLabel}` : ""}
                    </p>
                  )}
                  <p className="flex items-center gap-2.5">
                    <MapPin size={15} className="text-ink-soft shrink-0" />
                    {event.venue}
                  </p>
                  <p className="flex items-center gap-2.5">
                    <Users size={15} className="text-ink-soft shrink-0" />
                    {seatsLeft > 0 ? `${seatsLeft} of ${event.capacity} seats left` : "Fully booked"}
                  </p>
                  <div className="h-1.5 rounded-full bg-mist overflow-hidden">
                    <div className="h-full bg-ink rounded-full transition-all" style={{ width: `${pctTaken}%` }} />
                  </div>
                  <EventRegisterForm eventSlug={event.slug} ticketPkr={event.ticketPkr} discountPct={discount} />
                </div>
              </div>
            </Reveal>

            {event.complianceNote && (
              <Reveal delay={60}>
                <p className="flex gap-2 text-[12px] text-ink-soft leading-relaxed rounded-2xl bg-mist p-4">
                  <Info size={13} className="shrink-0 mt-0.5" /> {event.complianceNote}
                </p>
              </Reveal>
            )}

            <Reveal delay={90}>
              <div className="rounded-2xl border border-line p-4">
                <p className="text-[11px] tracking-[0.16em] uppercase font-semibold text-ink-soft">Share this event</p>
                <div className="flex gap-2 mt-3">
                  <a
                    className="btn btn-ghost !py-2 !px-4 text-xs"
                    href={`https://wa.me/?text=${encodeURIComponent(`${event.title} — Content Colony ${shareUrl}`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>
                  <a
                    className="btn btn-ghost !py-2 !px-4 text-xs"
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Facebook
                  </a>
                  <a
                    className="btn btn-ghost !py-2 !px-4 text-xs"
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${event.title} — Content Colony`)}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    X
                  </a>
                </div>
              </div>
            </Reveal>
          </aside>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
