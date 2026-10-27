import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accommodationTypes, bookings } from "@/db/schema";
import { formatDate, pkr } from "@/lib/utils";
import { AdminBadge } from "@/components/admin/form-shell";
import { ManualBookingForm } from "@/components/admin/booking-actions";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const rows = await db
    .select({ booking: bookings, type: accommodationTypes })
    .from(bookings)
    .leftJoin(accommodationTypes, eq(bookings.accommodationTypeId, accommodationTypes.id))
    .orderBy(desc(bookings.createdAt));
  const filtered = status ? rows.filter((r) => r.booking.status === status) : rows;

  const STATUSES = ["PENDING_PAYMENT", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED"];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display font-extrabold text-3xl tracking-tight">Bookings</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/bookings" className="text-[12px] px-3 py-1.5 rounded-full border border-line bg-paper hover:border-ink transition-colors">
            All ({rows.length})
          </Link>
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/admin/bookings?status=${s}`}
              className="text-[12px] px-3 py-1.5 rounded-full border border-line bg-paper hover:border-ink transition-colors"
            >
              {s.replace(/_/g, " ")} ({rows.filter((r) => r.booking.status === s).length})
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <ManualBookingForm />
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-paper overflow-x-auto">
        <table className="w-full text-sm min-w-[880px]">
          <thead>
            <tr className="text-left text-[11px] tracking-[0.12em] uppercase text-ink-soft border-b border-line">
              <th className="px-5 py-3.5 font-semibold">Reference</th>
              <th className="px-5 py-3.5 font-semibold">Guest</th>
              <th className="px-5 py-3.5 font-semibold">Type</th>
              <th className="px-5 py-3.5 font-semibold">Dates</th>
              <th className="px-5 py-3.5 font-semibold">Nights</th>
              <th className="px-5 py-3.5 font-semibold">Total</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ booking: b, type }) => (
              <tr key={b.id} className="border-b border-line last:border-0 hover:bg-mist/60 transition-colors">
                <td className="px-5 py-3.5 font-mono font-medium">{b.reference}</td>
                <td className="px-5 py-3.5">
                  {b.guestName}
                  <span className="block text-[12px] text-ink-soft">{b.guestEmail}</span>
                </td>
                <td className="px-5 py-3.5">{type?.name}</td>
                <td className="px-5 py-3.5 whitespace-nowrap">
                  {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                </td>
                <td className="px-5 py-3.5">{b.nights}{b.minStayOverride ? " *" : ""}</td>
                <td className="px-5 py-3.5 font-semibold">{pkr(b.totalPkr)}</td>
                <td className="px-5 py-3.5">
                  <AdminBadge tone={b.status === "CHECKED_IN" || b.status === "CONFIRMED" ? "dark" : "neutral"}>
                    {b.status.replace(/_/g, " ")}
                  </AdminBadge>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link href={`/admin/bookings/${b.id}`} className="text-[12.5px] font-medium underline underline-offset-2">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-ink-soft">
                  No bookings yet — share the site and they&apos;ll come.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] text-ink-soft mt-3">* minimum-stay override applied with a recorded reason (audit logged).</p>
    </div>
  );
}

export const dynamic = "force-dynamic";
