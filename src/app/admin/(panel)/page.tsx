import Link from "next/link";
import { and, desc, eq, gte, inArray, ne, sql } from "drizzle-orm";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BedDouble,
  CalendarDays,
  FileCheck2,
  Inbox,
  RefreshCcw,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { db } from "@/db";
import {
  beds,
  bookings,
  checkInOuts,
  eventProposals,
  events,
  ghlSyncs,
  kycDocuments,
  payments,
  rooms,
  signedAgreements,
} from "@/db/schema";
import { pkr, todayISO } from "@/lib/utils";
import { retryGhlSyncs } from "@/app/admin/actions";
import { ActionButton, AdminBadge } from "@/components/admin/form-shell";

function Stat({ label, value, sub, href, Icon }: { label: string; value: string | number; sub?: string; href?: string; Icon: React.ComponentType<{ size?: number }> }) {
  const inner = (
    <div className="rounded-2xl bg-paper border border-line p-5 h-full hover:border-ink transition-colors">
      <div className="flex items-center justify-between text-ink-soft">
        <p className="text-[11px] tracking-[0.14em] uppercase font-semibold">{label}</p>
        <Icon size={15} />
      </div>
      <p className="font-display font-extrabold text-2xl md:text-3xl tracking-tight mt-2">{value}</p>
      {sub && <p className="text-[12px] text-ink-soft mt-1">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function DashboardPage() {
  const today = todayISO();
  const monthStart = today.slice(0, 7) + "-01";

  const [
    arrivals,
    departures,
    activeResidents,
    pendingPayments,
    pendingKyc,
    allBookings,
    allBeds,
    allRooms,
    monthRevenue,
    outstanding,
    upcomingEvents,
    pendingProposals,
    ghl,
    signed,
  ] = await Promise.all([
    db.select().from(bookings).where(and(eq(bookings.checkIn, today), eq(bookings.status, "CONFIRMED"))),
    db.select().from(bookings).where(and(eq(bookings.checkOut, today), eq(bookings.status, "CHECKED_IN"))),
    db.select().from(bookings).where(eq(bookings.status, "CHECKED_IN")),
    db.select().from(payments).where(eq(payments.status, "PENDING")),
    db.select().from(kycDocuments).where(eq(kycDocuments.status, "PENDING")),
    db.select().from(bookings).where(ne(bookings.status, "CANCELLED")),
    db.select().from(beds).where(eq(beds.active, true)),
    db.select().from(rooms).where(eq(rooms.active, true)),
    db.select({ sum: sql<number>`coalesce(sum(amount_pkr),0)` }).from(payments)
      .where(and(eq(payments.status, "CONFIRMED"), gte(payments.createdAt, new Date(monthStart)))),
    db.select({ sum: sql<number>`coalesce(sum(amount_pkr),0)` }).from(payments).where(eq(payments.status, "PENDING")),
    db.select({ count: sql<number>`count(*)` }).from(events).where(eq(events.status, "PUBLISHED")),
    db.select({ count: sql<number>`count(*)` }).from(eventProposals).where(eq(eventProposals.status, "NEW")),
    db.select({ status: ghlSyncs.status, count: sql<number>`count(*)` }).from(ghlSyncs).groupBy(ghlSyncs.status),
    db.select().from(signedAgreements),
  ]);

  // Occupancy today: beds/rooms held by overlapping active bookings
  const holding = allBookings.filter(
    (b) => ["PENDING_PAYMENT", "CONFIRMED", "CHECKED_IN"].includes(b.status) && b.checkIn <= today && b.checkOut > today
  );
  const bedsBusy = new Set(holding.map((b) => b.bedId).filter(Boolean)).size;
  const privateBusy = new Set(holding.map((b) => b.roomId).filter((r): r is number => r != null && allRooms.find((x) => x.id === r)?.type === "PRIVATE_ROOM")).size;
  const totalPrivate = allRooms.filter((r) => r.type === "PRIVATE_ROOM").length;
  const occupancy = allBeds.length + totalPrivate > 0
    ? Math.round(((bedsBusy + privateBusy) / (allBeds.length + totalPrivate)) * 100)
    : 0;
  const unsignedCount = allBookings.filter(
    (b) => ["CONFIRMED", "PENDING_PAYMENT", "CHECKED_IN"].includes(b.status) && !signed.some((s) => s.bookingId === b.id)
  ).length;
  const ghlByStatus = Object.fromEntries(ghl.map((g) => [g.status, Number(g.count)]));
  const recentCheckEvents = await db.select().from(checkInOuts).orderBy(desc(checkInOuts.at)).limit(6);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight">Dashboard</h1>
          <p className="text-sm text-ink-soft mt-1">Assalam-o-alaikum — here&apos;s the house today.</p>
        </div>
        <ActionButton action={retryGhlSyncs} variant="ghost">
          <RefreshCcw size={12} /> Retry GHL syncs
        </ActionButton>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        <Stat label="Today's arrivals" value={arrivals.length} href="/admin/checkin" Icon={ArrowDownToLine} />
        <Stat label="Today's departures" value={departures.length} href="/admin/checkin" Icon={ArrowUpFromLine} />
        <Stat label="Active residents" value={activeResidents.length} href="/admin/guests" Icon={Users} />
        <Stat label="Occupancy today" value={`${occupancy}%`} sub={`${bedsBusy}/${allBeds.length} beds · ${privateBusy}/${totalPrivate} rooms`} href="/admin/rooms" Icon={BedDouble} />
        <Stat label="Revenue this month" value={pkr(Number(monthRevenue[0]?.sum ?? 0))} href="/admin/reports" Icon={TrendingUp} />
        <Stat label="Outstanding" value={pkr(Number(outstanding[0]?.sum ?? 0))} href="/admin/payments" Icon={Wallet} />
        <Stat label="Pending KYC reviews" value={pendingKyc.length} href="/admin/kyc" Icon={FileCheck2} />
        <Stat label="Event proposals" value={Number(pendingProposals[0]?.count ?? 0)} href="/admin/proposals" Icon={Inbox} />
      </div>

      <div className="grid lg:grid-cols-3 gap-3 mt-3">
        <div className="rounded-2xl bg-paper border border-line p-5">
          <p className="text-[11px] tracking-[0.14em] uppercase font-semibold text-ink-soft flex items-center gap-2">
            <CalendarDays size={13} /> Queues
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex justify-between"><span>Pending payment requests</span><b>{pendingPayments.length}</b></li>
            <li className="flex justify-between"><span>Unsigned agreements</span><b>{unsignedCount}</b></li>
            <li className="flex justify-between"><span>Upcoming published events</span><Link href="/admin/events" className="underline">{Number(upcomingEvents[0]?.count ?? 0)}</Link></li>
          </ul>
        </div>
        <div className="rounded-2xl bg-paper border border-line p-5">
          <p className="text-[11px] tracking-[0.14em] uppercase font-semibold text-ink-soft">GoHighLevel sync</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <AdminBadge tone="dark">Sent · {ghlByStatus.SENT ?? 0}</AdminBadge>
            <AdminBadge>Pending · {ghlByStatus.PENDING ?? 0}</AdminBadge>
            <AdminBadge tone="soft">Failed · {ghlByStatus.FAILED ?? 0}</AdminBadge>
            <AdminBadge>Skipped · {ghlByStatus.SKIPPED ?? 0}</AdminBadge>
          </div>
          <p className="text-[12px] text-ink-soft mt-3 leading-relaxed">
            {process.env.GHL_API_KEY && process.env.GHL_LOCATION_ID
              ? "Live API credentials detected — leads push on arrival."
              : "No GHL_API_KEY / GHL_LOCATION_ID yet — every lead is safely queued here for retry."}
          </p>
        </div>
        <div className="rounded-2xl bg-paper border border-line p-5">
          <p className="text-[11px] tracking-[0.14em] uppercase font-semibold text-ink-soft">Recent check-ins / outs</p>
          {recentCheckEvents.length === 0 ? (
            <p className="text-sm text-ink-soft mt-3">None yet — first residents incoming.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {recentCheckEvents.map((c) => (
                <li key={c.id} className="flex justify-between gap-2">
                  <span>{c.type === "CHECK_IN" ? "→ In" : "← Out"} · booking #{c.bookingId}</span>
                  <span className="text-ink-soft text-[12px]">{c.at.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
