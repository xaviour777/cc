import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { beds, bookings, checkInOuts, rooms } from "@/db/schema";
import { checkInGuest, checkOutGuest } from "@/app/admin/actions";
import { formatDate, todayISO } from "@/lib/utils";
import { ActionButton, AdminBadge } from "@/components/admin/form-shell";

function BookingRow({
  b,
  schedule,
  unit,
  action,
}: {
  b: typeof bookings.$inferSelect;
  schedule: string;
  unit: string;
  action?: "in" | "out";
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-5 border-b border-line last:border-0 hover:bg-mist/60 transition-colors">
      <div className="flex-1 min-w-52">
        <p className="font-medium">
          {b.guestName} <span className="font-mono text-[12px] text-ink-soft">· {b.reference}</span>
        </p>
        <p className="text-[12.5px] text-ink-soft mt-0.5">{schedule} · {unit}</p>
      </div>
      <AdminBadge tone={b.status === "CHECKED_IN" || b.status === "CONFIRMED" ? "dark" : "neutral"}>
        {b.status.replace(/_/g, " ")}
      </AdminBadge>
      {action === "in" && (
        <ActionButton
          variant="primary"
          action={async () => {
            const notes = window.prompt("Check-in notes (optional)") ?? "";
            return checkInGuest(b.id, notes);
          }}
        >
          Check in
        </ActionButton>
      )}
      {action === "out" && (
        <ActionButton
          variant="primary"
          action={async () => {
            const notes = window.prompt("Check-out notes (optional)") ?? "";
            return checkOutGuest(b.id, notes);
          }}
        >
          Check out
        </ActionButton>
      )}
      <Link href={`/admin/bookings/${b.id}`} className="text-[12.5px] font-medium underline underline-offset-2">
        Open
      </Link>
    </div>
  );
}

export default async function CheckInPage() {
  const today = todayISO();
  const [arrivals, departures, inHouse, history, allBeds, allRooms] = await Promise.all([
    db.select().from(bookings).where(and(eq(bookings.checkIn, today), eq(bookings.status, "CONFIRMED"))),
    db.select().from(bookings).where(and(eq(bookings.checkOut, today), eq(bookings.status, "CHECKED_IN"))),
    db.select().from(bookings).where(eq(bookings.status, "CHECKED_IN")).orderBy(bookings.checkOut),
    db.select().from(checkInOuts).orderBy(desc(checkInOuts.at)).limit(12),
    db.select().from(beds),
    db.select().from(rooms),
  ]);

  const unitOf = (b: typeof bookings.$inferSelect) =>
    b.bedId
      ? `Bunk ${allBeds.find((x) => x.id === b.bedId)?.label ?? "?"}`
      : b.roomId
        ? allRooms.find((x) => x.id === b.roomId)?.name ?? "Room"
        : "Unassigned";

  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl tracking-tight">Check-In / Check-Out</h1>
      <p className="text-sm text-ink-soft mt-1">{formatDate(today)} — front desk for the house.</p>

      <h2 className="font-display font-bold text-xl tracking-tight mt-8">Arriving today</h2>
      <div className="mt-3 rounded-2xl border border-line bg-paper">
        {arrivals.length === 0 && <p className="p-5 text-sm text-ink-soft">Nobody arriving today.</p>}
        {arrivals.map((b) => (
          <BookingRow key={b.id} b={b} schedule={`${b.nights} nights, until ${formatDate(b.checkOut)}`} unit={unitOf(b)} action="in" />
        ))}
      </div>

      <h2 className="font-display font-bold text-xl tracking-tight mt-8">Departing today</h2>
      <div className="mt-3 rounded-2xl border border-line bg-paper">
        {departures.length === 0 && <p className="p-5 text-sm text-ink-soft">No departures today.</p>}
        {departures.map((b) => (
          <BookingRow key={b.id} b={b} schedule={`since ${formatDate(b.checkIn)}`} unit={unitOf(b)} action="out" />
        ))}
      </div>

      <h2 className="font-display font-bold text-xl tracking-tight mt-8">In the house right now</h2>
      <div className="mt-3 rounded-2xl border border-line bg-paper">
        {inHouse.length === 0 && <p className="p-5 text-sm text-ink-soft">The house is quiet — no one checked in.</p>}
        {inHouse.map((b) => (
          <BookingRow key={b.id} b={b} schedule={`until ${formatDate(b.checkOut)}`} unit={unitOf(b)} action="out" />
        ))}
      </div>

      <h2 className="font-display font-bold text-xl tracking-tight mt-8">Recent activity</h2>
      <div className="mt-3 rounded-2xl border border-line bg-paper">
        {history.length === 0 && <p className="p-5 text-sm text-ink-soft">No check-ins recorded yet.</p>}
        {history.map((h) => (
          <div key={h.id} className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-line last:border-0 text-sm">
            <span className="font-medium">{h.type === "CHECK_IN" ? "Checked in" : "Checked out"} · booking #{h.bookingId}</span>
            <span className="text-[12px] text-ink-soft">
              {h.at.toLocaleString("en-GB")}{h.notes ? ` · ${h.notes}` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
