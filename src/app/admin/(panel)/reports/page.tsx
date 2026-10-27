import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  articles,
  beds,
  bookings,
  eventProposals,
  eventRegistrations,
  events,
  ghlSyncs,
  payments,
  rooms,
} from "@/db/schema";
import { pkr, todayISO } from "@/lib/utils";
import { AdminBadge } from "@/components/admin/form-shell";

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-paper border border-line p-5">
      <p className="text-[11px] tracking-[0.14em] uppercase font-semibold text-ink-soft">{label}</p>
      <p className="font-display font-extrabold text-2xl md:text-[28px] tracking-tight mt-2">{value}</p>
      {sub && <p className="text-[12px] text-ink-soft mt-1">{sub}</p>}
    </div>
  );
}

export default async function ReportsPage() {
  const today = todayISO();
  const monthStart = today.slice(0, 7) + "-01";

  const [pays, bks, regs, evs, allBeds, allRooms, proposals, ghl, arts] = await Promise.all([
    db.select().from(payments),
    db.select().from(bookings),
    db.select().from(eventRegistrations),
    db.select().from(events),
    db.select().from(beds),
    db.select().from(rooms).where(eq(rooms.type, "PRIVATE_ROOM")),
    db.select().from(eventProposals),
    db.select().from(ghlSyncs),
    db.select().from(articles),
  ]);

  const confirmed = pays.filter((p) => p.status === "CONFIRMED");
  const stayRevenue = confirmed.filter((p) => p.bookingId).reduce((s, p) => s + p.amountPkr, 0);
  const ticketRevenue = confirmed.filter((p) => p.eventRegistrationId).reduce((s, p) => s + p.amountPkr, 0);
  const outstanding = pays.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amountPkr, 0);
  const activeResidents = bks.filter((b) => b.status === "CHECKED_IN").length;

  // Occupancy: rented units over the current month vs total unit-nights
  const daysInMonth = new Date(Number(monthStart.slice(0, 4)), Number(monthStart.slice(5, 7)), 0).getDate();
  const totalUnits = allBeds.length + allRooms.length;
  const activeBookings = bks.filter((b) => ["CONFIRMED", "CHECKED_IN", "PENDING_PAYMENT"].includes(b.status));
  const bookedNights = activeBookings
    .filter((b) => b.checkIn < today && b.checkOut > monthStart)
    .reduce((s, b) => {
      const start = b.checkIn < monthStart ? monthStart : b.checkIn;
      const end = b.checkOut > today ? today : b.checkOut;
      const n = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000));
      return s + n;
    }, 0);
  const monthDaysSoFar = Math.max(1, Number(today.slice(8, 10)));
  const occupancyPct = Math.min(100, Math.round((bookedNights / (totalUnits * monthDaysSoFar)) * 100));
  const adr = bookedNights > 0 ? Math.round(stayRevenue / bookedNights) : 0;

  // 6-month revenue table
  const months: { key: string; label: string }[] = [];
  const d = new Date();
  for (let i = 5; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push({
      key: m.toISOString().slice(0, 7),
      label: m.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
    });
  }
  const byMonth = months.map((m) => ({
    ...m,
    stay: confirmed.filter((p) => p.bookingId && p.confirmedAt?.toISOString().slice(0, 7) === m.key).reduce((s, p) => s + p.amountPkr, 0),
    tickets: confirmed.filter((p) => p.eventRegistrationId && p.confirmedAt?.toISOString().slice(0, 7) === m.key).reduce((s, p) => s + p.amountPkr, 0),
  }));
  const maxMonth = Math.max(1, ...byMonth.map((m) => m.stay + m.tickets));

  const workshopRegs = regs.filter((r) => r.status !== "CANCELLED").length;
  const paidWorkshops = evs.filter((e) => e.status === "PUBLISHED" && e.ticketPkr > 0);
  const conversionBase = paidWorkshops.reduce((s, e) => s + e.capacity, 0);

  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl tracking-tight">Reports</h1>
      <p className="text-sm text-ink-soft mt-1">Simple, honest numbers — refundable deposits never count as revenue.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        <Card label="Revenue collected (all time)" value={pkr(stayRevenue + ticketRevenue)} sub={`${pkr(stayRevenue)} stays · ${pkr(ticketRevenue)} tickets`} />
        <Card label="Revenue outstanding" value={pkr(outstanding)} sub="Pending payment requests" />
        <Card label="Occupancy (month to date)" value={`${occupancyPct}%`} sub={`${bookedNights} unit-nights of ${totalUnits * monthDaysSoFar}`} />
        <Card label="Average nightly rate" value={pkr(adr)} sub="Stay revenue ÷ nights sold" />
        <Card label="Active residents" value={String(activeResidents)} />
        <Card label="Upcoming published events" value={String(evs.filter((e) => e.status === "PUBLISHED" && e.kind !== "WORKSHOP").length + paidWorkshops.length)} sub={`${pkr(ticketRevenue)} ticket revenue`} />
        <Card label="Workshop registrations" value={String(workshopRegs)} sub={`${conversionBase} published workshop seats → ${conversionBase ? Math.round((workshopRegs / Math.max(1, conversionBase)) * 100) : 0}% filled`} />
        <Card label="Partner enquiries" value={String(proposals.length)} sub="Event proposals received" />
        <Card label="GHL leads queued" value={String(ghl.length)} sub={`${ghl.filter((g) => g.status === "SENT").length} synced`} />
        <Card label="Articles published" value={String(arts.filter((a) => a.status === "PUBLISHED").length)} sub={`${arts.length} total in CMS`} />
        <Card label="Article traffic" value="—" sub="Connect an analytics ID in deployment env to see traffic" />
        <Card label="Properties" value="1" sub="Multi-property ready (Johar Town first)" />
      </div>

      <h2 className="font-display font-bold text-xl tracking-tight mt-10">Revenue by month</h2>
      <div className="mt-4 rounded-2xl border border-line bg-paper p-5">
        <div className="space-y-3">
          {byMonth.map((m) => (
            <div key={m.key} className="grid grid-cols-[90px_1fr_120px] items-center gap-4 text-sm">
              <span className="text-ink-soft">{m.label}</span>
              <div className="h-2.5 rounded-full bg-mist overflow-hidden">
                <div className="h-full bg-ink rounded-full" style={{ width: `${((m.stay + m.tickets) / maxMonth) * 100}%` }} />
              </div>
              <span className="text-right font-semibold">{pkr(m.stay + m.tickets)}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-5 pt-4 border-t border-line text-[12px] text-ink-soft">
          <AdminBadge tone="dark">Total incl. tickets</AdminBadge>
          <span>Stay {pkr(stayRevenue)} · Tickets {pkr(ticketRevenue)} — deposits excluded</span>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
