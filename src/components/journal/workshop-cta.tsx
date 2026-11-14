import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { formatDate, pkr } from "@/lib/utils";

type CtaEvent = {
  slug: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  timeLabel: string | null;
  ticketPkr: number;
};

/** Small "book a live workshop" card placed in the middle of journal articles. */
export default function WorkshopCta({ event }: { event: CtaEvent }) {
  const when = event.startDate
    ? `${formatDate(event.startDate)}${event.endDate && event.endDate !== event.startDate ? ` – ${formatDate(event.endDate)}` : ""}`
    : event.timeLabel ?? "Dates announced soon";

  return (
    <aside dir="ltr" lang="en" className="rounded-3xl bg-ink text-paper p-6 md:p-7 flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
      <div>
        <span className="kicker text-paper/55 block">Live workshop</span>
        <span className="font-display font-bold text-xl md:text-2xl tracking-tight block mt-2">{event.title}</span>
        <span className="text-paper/70 text-sm mt-2 inline-flex flex-wrap items-center gap-x-2 gap-y-1">
          <CalendarDays size={14} /> {when}
          {event.ticketPkr > 0 ? <span>· {pkr(event.ticketPkr)}</span> : <span>· Free</span>}
        </span>
        <span className="text-paper/60 text-[13.5px] mt-2 block">Stop building alone. Come build with us.</span>
      </div>
      <Link
        href={`/book?event=${event.slug}#events`}
        className="btn bg-paper text-ink hover:opacity-90 shrink-0 !py-2.5 !px-5 text-sm self-start sm:self-center"
      >
        Book your seat <ArrowRight size={15} />
      </Link>
    </aside>
  );
}
