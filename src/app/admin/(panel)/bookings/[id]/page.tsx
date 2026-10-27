import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { ArrowLeft, FileText } from "lucide-react";
import { db } from "@/db";
import {
  accommodationTypes,
  beds,
  bookings,
  checkInOuts,
  inventoryBlocks,
  kycDocuments,
  payments,
  refunds,
  rooms,
  signedAgreements,
} from "@/db/schema";
import { addPayment, confirmPaymentAction, refundPayment } from "@/app/admin/actions";
import { formatDate, pkr } from "@/lib/utils";
import { ActionButton, AdminBadge } from "@/components/admin/form-shell";
import { AssignUnitSelect, BookingOps } from "@/components/admin/booking-actions";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  const [b] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (!b) notFound();

  const [type, pays, refs, kyc, signed, history, allBeds, allRooms, blocks, siblings] = await Promise.all([
    db.select().from(accommodationTypes).where(eq(accommodationTypes.id, b.accommodationTypeId)).limit(1),
    db.select().from(payments).where(eq(payments.bookingId, id)).orderBy(desc(payments.createdAt)),
    db.select().from(refunds),
    db.select().from(kycDocuments).where(eq(kycDocuments.bookingId, id)).orderBy(desc(kycDocuments.createdAt)),
    db.select().from(signedAgreements).where(eq(signedAgreements.bookingId, id)).orderBy(desc(signedAgreements.id)).limit(1),
    db.select().from(checkInOuts).where(eq(checkInOuts.bookingId, id)).orderBy(desc(checkInOuts.at)),
    db.select().from(beds).where(eq(beds.active, true)),
    db.select().from(rooms).where(eq(rooms.active, true)),
    db.select().from(inventoryBlocks),
    db.select().from(bookings).where(and(ne(bookings.id, id), ne(bookings.status, "CANCELLED"), ne(bookings.status, "COMPLETED"))),
  ]);

  const paidConfirmed = pays.filter((p) => p.status === "CONFIRMED").reduce((s, p) => s + p.amountPkr, 0) -
    refs.filter((r) => r.status === "PROCESSED" && pays.some((p) => p.id === r.paymentId)).reduce((s, r) => s + r.amountPkr, 0);
  const outstandingAmt = Math.max(0, b.totalPkr - paidConfirmed);

  // assignment options: beds/rooms not conflicting on this booking's range
  const busyBedIds = new Set(
    siblings.filter((x) => x.checkIn < b.checkOut && x.checkOut > b.checkIn && x.bedId != null).map((x) => x.bedId as number)
  );
  const busyRoomIds = new Set(
    siblings.filter((x) => x.checkIn < b.checkOut && x.checkOut > b.checkIn && x.roomId != null).map((x) => x.roomId as number)
  );
  for (const bl of blocks) {
    if (bl.startDate < b.checkOut && bl.endDate > b.checkIn) {
      if (bl.bedId) busyBedIds.add(bl.bedId);
      if (bl.roomId) busyRoomIds.add(bl.roomId);
    }
  }
  const sharedRoomIds = new Set(allRooms.filter((r) => r.type === "SHARED_BUNK").map((r) => r.id));
  const isBunk = type[0]?.key === "SHARED_BUNK";
  const options = isBunk
    ? allBeds
        .filter((bd) => sharedRoomIds.has(bd.roomId))
        .map((bd) => ({
          value: `bed:${bd.id}`,
          label: `Bunk ${bd.label}${busyBedIds.has(bd.id) && bd.id !== b.bedId ? " (busy)" : ""}`,
        }))
    : allRooms
        .filter((r) => r.type === "PRIVATE_ROOM")
        .map((r) => ({
          value: `room:${r.id}`,
          label: `${r.name}${busyRoomIds.has(r.id) && r.id !== b.roomId ? " (busy on these dates)" : ""}`,
        }));
  const cleanOptions = options.filter(
    (o) => !o.label.includes("(busy") || o.value === (b.bedId ? `bed:${b.bedId}` : `room:${b.roomId}`)
  );

  return (
    <div>
      <Link href="/admin/bookings" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft size={15} /> All bookings
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight font-mono">{b.reference}</h1>
          <p className="text-sm text-ink-soft mt-1">
            {b.guestName} · {b.guestEmail} · {b.guestPhone}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {b.minStayOverride && <AdminBadge>Min-stay override</AdminBadge>}
          <AdminBadge tone="dark">{b.status.replace(/_/g, " ")}</AdminBadge>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-6 items-start">
        {/* Left: stay + payments */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-paper p-5">
            <p className="text-[11px] tracking-[0.14em] uppercase font-semibold text-ink-soft">Stay</p>
            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
              <div><p className="text-ink-soft text-[12px]">Accommodation</p><p className="font-medium">{type[0]?.name}</p></div>
              <div><p className="text-ink-soft text-[12px]">Guests</p><p className="font-medium">{b.guestsCount}</p></div>
              <div><p className="text-ink-soft text-[12px]">Check-in</p><p className="font-medium">{formatDate(b.checkIn)}</p></div>
              <div><p className="text-ink-soft text-[12px]">Check-out</p><p className="font-medium">{formatDate(b.checkOut)}</p></div>
              <div><p className="text-ink-soft text-[12px]">Nights</p><p className="font-medium">{b.nights}</p></div>
              <div>
                <p className="text-ink-soft text-[12px] mb-1">Assigned unit</p>
                <AssignUnitSelect bookingId={b.id} currentBedId={b.bedId} currentRoomId={b.roomId} options={cleanOptions} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-line space-y-1.5 text-sm">
              {b.priceBreakdown.map((l, i) => (
                <div key={i} className="flex justify-between gap-3">
                  <span className="text-ink-soft">{l.qty > 1 ? `${l.qty} × ` : ""}{l.label}</span>
                  <span>{pkr(l.subtotalPkr)}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold pt-2 border-t border-line">
                <span>Total</span><span>{pkr(b.totalPkr)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-ink-soft">Received (confirmed)</span><span>{pkr(paidConfirmed)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-ink-soft">Outstanding</span><span className="font-semibold">{pkr(outstandingAmt)}</span>
              </div>
            </div>
            {b.minStayOverrideReason && (
              <p className="mt-3 text-[12px] bg-mist rounded-xl px-4 py-3">
                Override reason: {b.minStayOverrideReason}
              </p>
            )}
            {b.notes && <p className="mt-2 text-[12px] bg-mist rounded-xl px-4 py-3">Notes: {b.notes}</p>}
          </div>

          {/* Payments */}
          <div className="rounded-2xl border border-line bg-paper p-5">
            <p className="text-[11px] tracking-[0.14em] uppercase font-semibold text-ink-soft">Payments</p>
            <ul className="mt-3 space-y-2.5">
              {pays.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-mist px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{pkr(p.amountPkr)} · {p.method.replace(/_/g, " ")}</p>
                    <p className="text-[11.5px] text-ink-soft">{p.status} · {p.createdAt.toLocaleDateString("en-GB")}{p.note ? ` · ${p.note}` : ""}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {p.status === "PENDING" && (
                      <ActionButton variant="primary" action={confirmPaymentAction.bind(null, p.id)}>Confirm</ActionButton>
                    )}
                    {p.status === "CONFIRMED" && (
                      <ActionButton
                        variant="danger"
                        action={async () => {
                          const amt = Number(window.prompt("Refund amount (PKR)", String(p.amountPkr)) ?? 0);
                          const reason = window.prompt("Refund reason") ?? "";
                          if (!amt || !reason) return { ok: false, error: "Amount and reason required" };
                          return refundPayment(p.id, amt, reason);
                        }}
                      >
                        Refund
                      </ActionButton>
                    )}
                  </div>
                </li>
              ))}
              {pays.length === 0 && <li className="text-sm text-ink-soft">No payments recorded.</li>}
            </ul>
            <form
              className="grid grid-cols-[1fr_auto_auto] gap-2 mt-4"
              action={async (fd: FormData) => {
                "use server";
                const amount = Number(fd.get("amount"));
                const method = String(fd.get("method")) as "BANK_TRANSFER" | "RAAST" | "CARD_LINK" | "CASH_ON_ARRIVAL";
                await addPayment(id, amount, method, String(fd.get("note") ?? ""));
              }}
            >
              <input name="amount" type="number" min={1} placeholder="Add received amount (PKR)" className="field !py-2.5 text-sm" required />
              <select name="method" className="field !py-2.5 text-sm !w-auto">
                <option value="BANK_TRANSFER">Bank</option>
                <option value="RAAST">Raast</option>
                <option value="CARD_LINK">Card link</option>
                <option value="CASH_ON_ARRIVAL">Cash</option>
              </select>
              <button className="btn btn-primary !py-2.5 !px-5 text-sm">Record</button>
            </form>
            <p className="text-[11.5px] text-ink-soft mt-2">Refundable deposits are tracked separately and never counted as revenue.</p>
          </div>
        </div>

        {/* Right: ops + compliance */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-paper p-5">
            <p className="text-[11px] tracking-[0.14em] uppercase font-semibold text-ink-soft mb-3">Operations</p>
            <BookingOps
              bookingId={b.id}
              status={b.status}
              complianceHotelEye={b.complianceHotelEye}
              complianceTempResident={b.complianceTempResident}
            />
            {history.length > 0 && (
              <ul className="mt-4 pt-3 border-t border-line space-y-1.5 text-[12.5px] text-ink-soft">
                {history.map((h) => (
                  <li key={h.id}>
                    {h.type === "CHECK_IN" ? "Checked in" : "Checked out"} — {h.at.toLocaleString("en-GB")}
                    {h.notes ? ` · ${h.notes}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-paper p-5">
            <p className="text-[11px] tracking-[0.14em] uppercase font-semibold text-ink-soft">KYC documents</p>
            {kyc.length === 0 && <p className="text-sm text-ink-soft mt-3">Guest hasn&apos;t uploaded ID yet.</p>}
            <ul className="mt-3 space-y-2">
              {kyc.map((k) => (
                <li key={k.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-mist px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{k.docType}{k.idNumberLast4 ? ` ····${k.idNumberLast4}` : ""}</p>
                    <p className="text-[11.5px] text-ink-soft">{k.status}</p>
                  </div>
                  <a href={`/api/kyc/${k.id}`} target="_blank" className="text-[12.5px] font-medium underline underline-offset-2" rel="noreferrer">
                    View securely
                  </a>
                </li>
              ))}
            </ul>
            <Link href="/admin/kyc" className="text-[12.5px] font-medium underline underline-offset-2 mt-3 inline-block">
              Review in KYC center
            </Link>
          </div>

          <div className="rounded-2xl border border-line bg-paper p-5">
            <p className="text-[11px] tracking-[0.14em] uppercase font-semibold text-ink-soft flex items-center gap-2">
              <FileText size={13} /> Stay agreement
            </p>
            {signed[0] ? (
              <details className="mt-3 group">
                <summary className="text-sm font-medium cursor-pointer">
                  Signed by {signed[0].signerName} (v{signed[0].agreementVersion}) on {formatDate(signed[0].signedAt)} — view document
                </summary>
                <div
                  className="agreement-paper mt-3 p-5 text-[13px] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: signed[0].documentHtml }}
                />
              </details>
            ) : (
              <p className="text-sm text-ink-soft mt-3">Not signed yet — remind the guest to sign from their portal.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
