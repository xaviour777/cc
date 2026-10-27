import { desc, ne } from "drizzle-orm";
import { db } from "@/db";
import { bookings, studioReservations } from "@/db/schema";
import { cancelStudioReservation } from "@/app/admin/actions";
import { formatDate, todayISO } from "@/lib/utils";
import { ActionButton, AdminBadge } from "@/components/admin/form-shell";

export default async function StudioAdminPage() {
  const [reservations, bks] = await Promise.all([
    db.select().from(studioReservations).where(ne(studioReservations.status, "CANCELLED")).orderBy(desc(studioReservations.date)),
    db.select().from(bookings),
  ]);
  const upcoming = reservations.filter((r) => r.date >= todayISO());
  const past = reservations.filter((r) => r.date < todayISO());

  const Table = ({ rows }: { rows: typeof reservations }) => (
    <div className="rounded-2xl border border-line bg-paper overflow-x-auto">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="text-left text-[11px] tracking-[0.12em] uppercase text-ink-soft border-b border-line">
            <th className="px-5 py-3.5 font-semibold">Date</th>
            <th className="px-5 py-3.5 font-semibold">Slot</th>
            <th className="px-5 py-3.5 font-semibold">Space</th>
            <th className="px-5 py-3.5 font-semibold">Resident</th>
            <th className="px-5 py-3.5 font-semibold">Purpose</th>
            <th className="px-5 py-3.5" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const b = r.bookingId ? bks.find((x) => x.id === r.bookingId) : undefined;
            return (
              <tr key={r.id} className="border-b border-line last:border-0 hover:bg-mist/60">
                <td className="px-5 py-3.5 whitespace-nowrap">{formatDate(r.date)}</td>
                <td className="px-5 py-3.5">{r.slot}</td>
                <td className="px-5 py-3.5">
                  <AdminBadge tone={r.resource === "STUDIO" ? "dark" : "neutral"}>
                    {r.resource === "STUDIO" ? "Studio" : "Call pod"}
                  </AdminBadge>
                </td>
                <td className="px-5 py-3.5">
                  {r.name}
                  <span className="block text-[12px] text-ink-soft">{b?.reference ?? r.email}</span>
                </td>
                <td className="px-5 py-3.5">{r.purpose ?? "—"}</td>
                <td className="px-5 py-3.5 text-right">
                  <ActionButton variant="danger" confirm="Cancel this reservation?" action={cancelStudioReservation.bind(null, r.id)}>
                    Cancel
                  </ActionButton>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr><td colSpan={6} className="px-5 py-8 text-center text-ink-soft">Nothing booked.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl tracking-tight">Studio & Call Pod</h1>
      <p className="text-sm text-ink-soft mt-1">Residents self-book two-hour slots inside their stay window.</p>
      <h2 className="font-display font-bold text-xl tracking-tight mt-8">Upcoming</h2>
      <div className="mt-3"><Table rows={upcoming} /></div>
      <h2 className="font-display font-bold text-xl tracking-tight mt-8">Past</h2>
      <div className="mt-3"><Table rows={past} /></div>
    </div>
  );
}

export const dynamic = "force-dynamic";
