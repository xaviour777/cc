import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, eventRegistrations, events, payments, refunds } from "@/db/schema";
import { confirmPaymentAction } from "@/app/admin/actions";
import { pkr } from "@/lib/utils";
import { ActionButton, AdminBadge } from "@/components/admin/form-shell";

export default async function PaymentsPage() {
  const [pays, refs, bk, regs, evs] = await Promise.all([
    db.select().from(payments).orderBy(desc(payments.createdAt)),
    db.select().from(refunds),
    db.select().from(bookings),
    db.select().from(eventRegistrations),
    db.select().from(events),
  ]);

  const label = (p: (typeof pays)[number]) => {
    if (p.bookingId) {
      const b = bk.find((x) => x.id === p.bookingId);
      return b ? `Stay · ${b.reference}` : "Stay";
    }
    if (p.eventRegistrationId) {
      const r = regs.find((x) => x.id === p.eventRegistrationId);
      const e = r ? evs.find((y) => y.id === r.eventId) : null;
      return `Ticket · ${e?.title ?? "Event"}`;
    }
    return p.kind;
  };

  const collected = pays.filter((p) => p.status === "CONFIRMED").reduce((s, p) => s + p.amountPkr, 0);
  const refunded = refs.filter((r) => r.status === "PROCESSED").reduce((s, r) => s + r.amountPkr, 0);
  const pendingSum = pays.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amountPkr, 0);

  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl tracking-tight">Payments</h1>
      <div className="grid grid-cols-3 gap-3 mt-5">
        <div className="rounded-2xl bg-paper border border-line p-4">
          <p className="text-[11px] tracking-[0.14em] uppercase font-semibold text-ink-soft">Collected</p>
          <p className="font-display font-extrabold text-2xl mt-1">{pkr(collected)}</p>
        </div>
        <div className="rounded-2xl bg-paper border border-line p-4">
          <p className="text-[11px] tracking-[0.14em] uppercase font-semibold text-ink-soft">Pending</p>
          <p className="font-display font-extrabold text-2xl mt-1">{pkr(pendingSum)}</p>
        </div>
        <div className="rounded-2xl bg-paper border border-line p-4">
          <p className="text-[11px] tracking-[0.14em] uppercase font-semibold text-ink-soft">Refunded</p>
          <p className="font-display font-extrabold text-2xl mt-1">{pkr(refunded)}</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-paper overflow-x-auto">
        <table className="w-full text-sm min-w-[840px]">
          <thead>
            <tr className="text-left text-[11px] tracking-[0.12em] uppercase text-ink-soft border-b border-line">
              <th className="px-5 py-3.5 font-semibold">When</th>
              <th className="px-5 py-3.5 font-semibold">For</th>
              <th className="px-5 py-3.5 font-semibold">Method</th>
              <th className="px-5 py-3.5 font-semibold">Amount</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {pays.map((p) => {
              const refundsFor = refs.filter((r) => r.paymentId === p.id);
              return (
                <tr key={p.id} className="border-b border-line last:border-0 hover:bg-mist/60">
                  <td className="px-5 py-3.5 whitespace-nowrap">{p.createdAt.toLocaleDateString("en-GB")}</td>
                  <td className="px-5 py-3.5">
                    {p.bookingId ? (
                      <Link href={`/admin/bookings/${p.bookingId}`} className="underline underline-offset-2">{label(p)}</Link>
                    ) : (
                      label(p)
                    )}
                    {refundsFor.map((r) => (
                      <span key={r.id} className="block text-[11.5px] text-ink-soft">
                        Refunded {pkr(r.amountPkr)} — {r.reason}
                      </span>
                    ))}
                  </td>
                  <td className="px-5 py-3.5">{p.method.replace(/_/g, " ")}</td>
                  <td className="px-5 py-3.5 font-semibold">{pkr(p.amountPkr)}</td>
                  <td className="px-5 py-3.5">
                    <AdminBadge tone={p.status === "CONFIRMED" ? "dark" : "neutral"}>{p.status}</AdminBadge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {p.status === "PENDING" && (
                      <ActionButton variant="primary" action={confirmPaymentAction.bind(null, p.id)}>Confirm</ActionButton>
                    )}
                  </td>
                </tr>
              );
            })}
            {pays.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-ink-soft">No payments yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] text-ink-soft mt-3">
        Deposits are held separately (and excluded from revenue). Card gateway credentials are pending owner authorization — card payments are collected via secure links and confirmed here.
      </p>
    </div>
  );
}

export const dynamic = "force-dynamic";
