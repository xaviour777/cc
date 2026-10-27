import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin, Users } from "lucide-react";
import type { PublicEvent } from "@/lib/data";
import { cx, formatDate, pkr } from "@/lib/utils";
import Reveal from "@/components/ui/reveal";

export default function EventCard({
  event,
  big = false,
  delay = 0,
}: {
  event: PublicEvent;
  big?: boolean;
  delay?: number;
}) {
  const dateLabel = event.startDate
    ? `${formatDate(event.startDate)}${event.endDate && event.endDate !== event.startDate ? ` – ${formatDate(event.endDate)}` : ""}`
    : "Dates announced soon";
  const seatsLeft = Math.max(0, event.capacity - event.seatsTaken);

  return (
    <Reveal delay={delay}>
      <Link
        href={`/events/${event.slug}`}
        className={cx(
          "group block rounded-3xl border border-line bg-paper overflow-hidden card-lift",
          big && "md:col-span-2"
        )}
      >
        <div className={cx("img-frame relative", big ? "aspect-[21/9]" : "aspect-[16/10]")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.image ?? ""}
            alt={event.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="bg-paper/90 backdrop-blur px-3 py-1.5 rounded-full text-[11px] tracking-[0.14em] uppercase font-semibold">
              {event.category}
            </span>
            {event.ticketPkr === 0 && (
              <span className="bg-ink text-paper px-3 py-1.5 rounded-full text-[11px] tracking-[0.14em] uppercase font-semibold">
                Free entry
              </span>
            )}
          </div>
        </div>
        <div className="p-6 md:p-7">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={13} /> {dateLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={13} /> {event.venue}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={13} /> {seatsLeft > 0 ? `${seatsLeft} seats left` : "Full"}
            </span>
          </div>
          <h3 className={cx("font-display font-bold tracking-tight mt-3", big ? "text-2xl md:text-3xl" : "text-xl")}>
            {event.title}
          </h3>
          {event.hostName && (
            <div className="flex items-center gap-2.5 mt-3">
              {event.hostImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.hostImage}
                  alt={event.hostName}
                  className="w-8 h-8 rounded-full object-cover grayscale"
                />
              )}
              <p className="text-sm text-ink-soft">
                {event.hostName}
                {event.hostRole ? ` · ${event.hostRole}` : ""}
              </p>
            </div>
          )}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-line">
            <p className="font-semibold text-sm">
              {event.ticketPkr > 0 ? (
                <>
                  {pkr(event.ticketPkr)}
                  <span className="text-ink-soft font-normal"> · residents save {event.residentDiscountPct ?? 25}%</span>
                </>
              ) : (
                "Community event"
              )}
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium group-hover:gap-2.5 transition-all">
              Details <ArrowUpRight size={15} />
            </span>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}
