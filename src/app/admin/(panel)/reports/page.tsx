import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  accommodationTypes,
  articles,
  beds,
  bookings,
  eventProposals,
  eventRegistrations,
  events,
  ghlSyncs,
  inventoryBlocks,
  payments,
  ratePlans,
  rooms,
} from "@/db/schema";
import { getSetting } from "@/lib/stays";
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

  const [pays, bks, regs, evs, allBeds, allRooms, proposals, ghl, arts, plans, blocks, allRoomRows, opexSetting, types] = await Promise.all([
    db.select().from(payments),
    db.select().from(bookings),
    db.select().from(eventRegistrations),
    db.select().from(events),
    db.select().from(beds),
    db.select().from(rooms).where(eq(rooms.type, "PRIVATE_ROOM")),
    db.select().from(eventProposals),
    db.select().from(ghlSyncs),
    db.select().from(articles),
    db.select().from(ratePlans).where(eq(ratePlans.active, true)),
    db.select().from(inventoryBlocks),
    db.select().from(rooms),
    getSetting<number>("monthlyOpexPkr", 400000),
    db.select().from(accommodationTypes),
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


  // ---------- Monthly projection vs operating expense ----------
  const opex = Number(opexSetting) || 0;
  const monthEnd = new Date(Date.UTC(Number(monthStart.slice(0, 4)), Number(monthStart.slice(5, 7)), 1)).toISOString().slice(0, 10);
  const overlapNights = (a: string, b: string) =>
    Math.max(0, Math.round((new Date(b < monthEnd ? b : monthEnd).getTime() - new Date(a > monthStart ? a : monthStart).getTime()) / 86400000));
  const roomById = new Map(allRoomRows.map((r) => [r.id, r]));
  const priceFor = (typeKey: string) => {
    const typeId = types.find((t) => t.key === typeKey)?.id;
    const own = plans.filter((p) => p.accommodationTypeId === typeId);
    const nightly = own.find((p) => p.unitNights === 1)?.pricePkr ?? 0;
    const monthly = own.find((p) => p.unitNights >= 28);
    return { nightly, monthlyPerNight: monthly ? monthly.pricePkr / monthly.unitNights : nightly };
  };
  const units = [
    ...allBeds
      .filter((b) => b.active && roomById.get(b.roomId)?.active && roomById.get(b.roomId)?.type === "SHARED_BUNK")
      .map((b) => ({ kind: "SHARED_BUNK", bedId: b.id as number | null, roomId: b.roomId })),
    ...allRoomRows
      .filter((r) => r.active && r.type === "PRIVATE_ROOM")
      .map((r) => ({ kind: "PRIVATE_ROOM", bedId: null as number | null, roomId: r.id })),
  ];
  const unitRows = units.map((u) => {
    const blocked = blocks
      .filter((k) => (u.bedId && k.bedId === u.bedId) || (k.roomId === u.roomId && !k.bedId))
      .reduce((s, k) => s + overlapNights(k.startDate, k.endDate), 0);
    const avail = Math.max(0, daysInMonth - blocked);
    const pr = priceFor(u.kind);
    return { ...u, blocked, avail, fullNightly: avail * pr.nightly, fullMonthly: Math.round(avail * pr.monthlyPerNight) };
  });
  const sellableNights = unitRows.reduce((s, u) => s + u.avail, 0);
  const blockedNights = unitRows.reduce((s, u) => s + u.blocked, 0);
  const fullAtNightly = unitRows.reduce((s, u) => s + u.fullNightly, 0);
  const fullAtMonthly = unitRows.reduce((s, u) => s + u.fullMonthly, 0);
  const monthBookings = bks.filter(
    (b) => b.status !== "CANCELLED" && b.checkIn < monthEnd && b.checkOut > monthStart
  );
  const bookedThisMonth = Math.round(
    monthBookings.reduce((s, b) => s + (b.nights > 0 ? (b.totalPkr / b.nights) * overlapNights(b.checkIn, b.checkOut) : 0), 0)
  );
  const soldNightsThisMonth = monthBookings.reduce((s, b) => s + overlapNights(b.checkIn, b.checkOut), 0);
  const monthResult = bookedThisMonth - opex;
  const breakEvenPct = (full: number) => (full > 0 ? Math.round((opex / full) * 100) : 0);
  const scenarios = [25, 50, 75, 100].map((pct) => ({
    pct,
    nightly: Math.round((fullAtNightly * pct) / 100),
    monthly: Math.round((fullAtMonthly * pct) / 100),
  }));
  const monthLabel = new Date(monthStart).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const bunkCount = unitRows.filter((u) => u.kind === "SHARED_BUNK").length;
  const privCount = unitRows.filter((u) => u.kind === "PRIVATE_ROOM").length;
  const privFree = unitRows.filter((u) => u.kind === "PRIVATE_ROOM" && u.avail > 0).length;
  const signed = (n: number) => (n >= 0 ? `+${pkr(n)}` : `−${pkr(Math.abs(n))}`);

  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl tracking-tight">Reports</h1>
      <p className="text-sm text-ink-soft mt-1">Simple, honest numbers — refundable deposits never count as revenue.</p>


      <h2 className="font-display font-bold text-xl tracking-tight mt-8">Profit &amp; loss projection · {monthLabel}</h2>
      <p className="text-sm text-ink-soft mt-1">
        Monthly operating expense {pkr(opex)} (change it in Settings). {bunkCount} bunks and {privCount} private rooms listed, {privFree} private room{privFree === 1 ? "" : "s"} sellable this month; {blockedNights} unit-nights blocked (team / held).
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <Card label="Booked revenue this month" value={pkr(bookedThisMonth)} sub={`${soldNightsThisMonth} of ${sellableNights} sellable unit-nights`} />
        <Card
          label={monthResult >= 0 ? "Profit this month" : "Loss this month"}
          value={signed(monthResult)}
          sub={`Booked revenue − ${pkr(opex)} expense`}
        />
        <Card label="Break-even occupancy" value={`${breakEvenPct(fullAtMonthly)}%`} sub={`at monthly package prices · ${breakEvenPct(fullAtNightly)}% at nightly prices`} />
        <Card label="Expense covered" value={`${opex > 0 ? Math.round((bookedThisMonth / opex) * 100) : 0}%`} sub="Booked revenue ÷ operating expense" />
      </div>
      <div className="mt-4 rounded-2xl border border-line bg-paper overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-[11px] tracking-[0.12em] uppercase text-ink-soft border-b border-line">
              <th className="px-5 py-3.5 font-semibold">Occupancy</th>
              <th className="px-5 py-3.5 font-semibold">Revenue (monthly packages)</th>
              <th className="px-5 py-3.5 font-semibold">Profit / loss</th>
              <th className="px-5 py-3.5 font-semibold">Revenue (nightly price)</th>
              <th className="px-5 py-3.5 font-semibold">Profit / loss</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((sc) => (
              <tr key={sc.pct} className="border-b border-line last:border-0">
                <td className="px-5 py-3.5 font-medium">{sc.pct}%</td>
                <td className="px-5 py-3.5">{pkr(sc.monthly)}</td>
                <td className={`px-5 py-3.5 font-semibold ${sc.monthly - opex < 0 ? "text-red-600" : "text-emerald-700"}`}>{signed(sc.monthly - opex)}</td>
                <td className="px-5 py-3.5">{pkr(sc.nightly)}</td>
                <td className={`px-5 py-3.5 font-semibold ${sc.nightly - opex < 0 ? "text-red-600" : "text-emerald-700"}`}>{signed(sc.nightly - opex)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
