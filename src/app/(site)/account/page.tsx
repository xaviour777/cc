import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { ArrowRight, BedDouble, CalendarDays } from "lucide-react";
import { db } from "@/db";
import { accommodationTypes, bookings, eventRegistrations, events } from "@/db/schema";
import { getMember } from "@/lib/members";
import { formatDate, pkr } from "@/lib/utils";
import { LogoutButton } from "@/components/account/forms";

export const metadata: Metadata = { title: "My account", robots: { index: false } };
export const dynamic = "force-dynamic";

const STAY_STATUS: Record<string, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked in",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default async function AccountPage() {
  const member = await getMember();
  if (!member) redirect("/account/login");

  const [stays, types, regs] = await Promise.all([
    db.select().from(bookings).where(eq(bookings.guestEmail, member.email)).orderBy(desc(bookings.checkIn)),
    db.select().from(accommodationTypes),
    db
      .select({ reg: eventRegistrations, event: events })
      .from(eventRegistrations)
      .innerJoin(events, eq(eventRegistrations.eventId, events.id))
      .where(eq(eventRegistrations.email, member.email))
      .orderBy(desc(eventRegistrations.createdAt)),
  ]);
  const typeName = (id: number) => types.find((t) => t.id === id)?.name ?? "Stay";
  const portal = (ref: string) => `/booking/${ref}?email=${encodeURIComponent(member.email)}`;

  return (
    <div className="px-5 md:px-10 py-12 md:py-16">
      <div className="mx-auto max-w-[1000px]">
        <div className="rounded-3xl bg-ink text-paper p-7 md:p-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="kicker text-paper/50">Colony member</p>
            <h1 className="font-display font-extrabold text-3xl md:text-5xl tracking-tight mt-2">
              Welcome home, {member.name.split(" ")[0]}.
            </h1>
            <p className="text-paper/70 text-sm mt-3">
              Member since {member.createdAt.toLocaleDateString("en-GB", { month: "long", year: "numeric" })} · {member.email}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/book?stay=1#stay" className="btn !bg-paper !text-ink">Book a stay <ArrowRight size={16} /></Link>
            <Link href="/events" className="btn btn-outline !border-paper/40 !text-paper">See events</Link>
          </div>
        </div>

        <h2 className="font-display font-bold text-xl tracking-tight mt-10 flex items-center gap-2">
          <BedDouble size={18} /> My stays
        </h2>
        <div className="mt-4 space-y-3">
          {stays.map((b) => (
            <Link
              key={b.id}
              href={portal(b.reference)}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-paper p-5 hover:border-ink transition-colors"
            >
              <div>
                <p className="font-semibold">{typeName(b.accommodationTypeId)} · <span className="font-mono text-sm">{b.reference}</span></p>
                <p className="text-sm text-ink-soft mt-1">
                  {formatDate(b.checkIn)} → {formatDate(b.checkOut)} · {b.nights} nights
                  {!b.pricePending && b.totalPkr > 0 ? ` · ${pkr(b.totalPkr)}` : ""}
                </p>
              </div>
              <span className="text-[12px] tracking-[0.12em] uppercase font-semibold bg-mist px-3 py-1.5 rounded-full">
                {STAY_STATUS[b.status] ?? b.status}
              </span>
            </Link>
          ))}
          {stays.length === 0 && <p className="text-sm text-ink-soft">No stays yet.</p>}
        </div>

        <h2 className="font-display font-bold text-xl tracking-tight mt-10 flex items-center gap-2">
          <CalendarDays size={18} /> My events
        </h2>
        <div className="mt-4 space-y-3">
          {regs.map(({ reg, event }) => (
            <Link
              key={reg.id}
              href={`/events/${event.slug}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-paper p-5 hover:border-ink transition-colors"
            >
              <div>
                <p className="font-semibold">{event.title}</p>
                <p className="text-sm text-ink-soft mt-1">{formatDate(event.startDate)}</p>
              </div>
              <span className="text-[12px] tracking-[0.12em] uppercase font-semibold bg-mist px-3 py-1.5 rounded-full">
                {reg.status.replace("_", " ").toLowerCase()}
              </span>
            </Link>
          ))}
          {regs.length === 0 && <p className="text-sm text-ink-soft">No events yet. <Link href="/events" className="u-link">See what&apos;s on</Link>.</p>}
        </div>

        <div className="mt-12">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
