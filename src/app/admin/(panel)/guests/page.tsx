import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { bookings, kycDocuments, signedAgreements } from "@/db/schema";
import { formatDate } from "@/lib/utils";
import { AdminBadge } from "@/components/admin/form-shell";

export default async function GuestsPage() {
  const [rows, kyc, signed] = await Promise.all([
    db.select().from(bookings).orderBy(desc(bookings.createdAt)),
    db.select().from(kycDocuments),
    db.select().from(signedAgreements),
  ]);

  // Group by guest email
  const byGuest = new Map<string, typeof rows>();
  for (const b of rows) {
    byGuest.set(b.guestEmail, [...(byGuest.get(b.guestEmail) ?? []), b]);
  }

  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl tracking-tight">Guests</h1>
      <p className="text-sm text-ink-soft mt-1">Every person who has booked, with their verification state.</p>

      <div className="mt-6 rounded-2xl border border-line bg-paper overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="text-left text-[11px] tracking-[0.12em] uppercase text-ink-soft border-b border-line">
              <th className="px-5 py-3.5 font-semibold">Guest</th>
              <th className="px-5 py-3.5 font-semibold">Stays</th>
              <th className="px-5 py-3.5 font-semibold">Latest stay</th>
              <th className="px-5 py-3.5 font-semibold">ID status</th>
              <th className="px-5 py-3.5 font-semibold">Agreement</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {[...byGuest.entries()].map(([email, list]) => {
              const latest = list[0];
              const docs = kyc.filter((k) => list.some((b) => b.id === k.bookingId));
              const kycState = docs.some((d) => d.status === "APPROVED")
                ? "Approved"
                : docs.some((d) => d.status === "PENDING")
                  ? "Pending review"
                  : "Not submitted";
              const hasSigned = signed.some((s) => list.some((b) => b.id === s.bookingId));
              return (
                <tr key={email} className="border-b border-line last:border-0 hover:bg-mist/60">
                  <td className="px-5 py-3.5">
                    <p className="font-medium">{latest.guestName}</p>
                    <p className="text-[12px] text-ink-soft">{email} · {latest.guestPhone}</p>
                  </td>
                  <td className="px-5 py-3.5">{list.length}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <Link href={`/admin/bookings/${latest.id}`} className="underline underline-offset-2 font-mono text-[13px]">
                      {latest.reference}
                    </Link>
                    <span className="block text-[12px] text-ink-soft">{formatDate(latest.checkIn)} → {formatDate(latest.checkOut)}</span>
                  </td>
                  <td className="px-5 py-3.5">{kycState}</td>
                  <td className="px-5 py-3.5">{hasSigned ? "Signed" : "—"}</td>
                  <td className="px-5 py-3.5">
                    <AdminBadge tone={latest.status === "CHECKED_IN" ? "dark" : "neutral"}>
                      {latest.status.replace(/_/g, " ")}
                    </AdminBadge>
                  </td>
                </tr>
              );
            })}
            {byGuest.size === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-ink-soft">No guests yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
