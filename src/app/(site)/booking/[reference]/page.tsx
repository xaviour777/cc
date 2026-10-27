import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { BadgePercent, BedDouble, CalendarDays, Check, CircleDashed, Wallet } from "lucide-react";
import { db } from "@/db";
import { beds, payments, rooms } from "@/db/schema";
import { getPortal } from "@/lib/actions";
import { getPublicEvents, getSetting } from "@/lib/data";
import { cx, formatDate, pkr } from "@/lib/utils";
import Reveal from "@/components/ui/reveal";
import {
  AgreementSigner,
  KycUpload,
  PortalVerify,
  StudioBooker,
} from "@/components/booking/portal-client";

export const metadata: Metadata = { title: "Your booking portal" };

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked in — welcome home",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const METHOD_HELP: Record<string, string> = {
  BANK_TRANSFER:
    "Transfer to our company account — bank details are shared on WhatsApp/email right after your request. Send the receipt to confirm faster.",
  RAAST: "Send instantly to our Raast ID (shared on WhatsApp/email after your request).",
  CARD_LINK: "We'll send a secure card payment link to your WhatsApp/email.",
  CASH_ON_ARRIVAL: "Cash on arrival needs admin approval — we'll confirm on WhatsApp within a day.",
};

export default async function BookingPortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { reference } = await params;
  const { email } = await searchParams;

  if (!email) {
    return (
      <div className="px-5 md:px-10 py-20">
        <PortalVerify reference={reference.toUpperCase()} />
      </div>
    );
  }

  const portal = await getPortal(reference, email);
  if (!portal.ok) {
    return (
      <div className="px-5 md:px-10 py-24 text-center">
        <h1 className="display-md">We couldn&apos;t verify that.</h1>
        <p className="text-ink-soft mt-3">{portal.error}</p>
        <Link href="/booking" className="btn btn-outline mt-6">Try again</Link>
      </div>
    );
  }

  const b = portal.booking;
  const [paymentRows, bedRow, roomRow, discount, upcomingEvents] = await Promise.all([
    db.select().from(payments).where(eq(payments.bookingId, b.id)),
    b.bedId ? db.select().from(beds).where(eq(beds.id, b.bedId)).limit(1) : Promise.resolve([]),
    b.roomId ? db.select().from(rooms).where(eq(rooms.id, b.roomId)).limit(1) : Promise.resolve([]),
    getSetting<number>("residentDiscountPct", 25),
    getPublicEvents(),
  ]);
  const payment = paymentRows[0];
  const paid = payment?.status === "CONFIRMED";
  const kycOk = portal.kyc.some((k) => k.status === "APPROVED");
  const unitLabel =
    b.bedId && bedRow[0]
      ? `Bunk ${bedRow[0].label}`
      : b.roomId && roomRow[0]
        ? roomRow[0].name
        : "Assigned at check-in";

  const steps = [
    { label: "Payment", done: paid },
    { label: "ID verification", done: kycOk },
    { label: "Agreement signed", done: Boolean(portal.signed) },
    { label: "Check in", done: b.status === "CHECKED_IN" || b.status === "COMPLETED" },
  ];

  return (
    <div className="px-5 md:px-10 py-10 md:py-16">
      <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <Reveal>
          <div className="rounded-3xl bg-ink text-paper p-7 md:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="kicker text-paper/50">Booking portal</p>
                <h1 className="font-display font-extrabold text-3xl md:text-5xl tracking-tight mt-2">
                  {b.reference}
                </h1>
              </div>
              <span className="text-[12px] tracking-[0.14em] uppercase font-semibold bg-paper text-ink px-4 py-2 rounded-full">
                {STATUS_LABEL[b.status]}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2 mt-6 text-paper/70 text-sm">
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={15} /> {formatDate(b.checkIn)} → {formatDate(b.checkOut)} · {b.nights} nights
              </span>
              <span className="inline-flex items-center gap-2">
                <BedDouble size={15} /> {portal.typeName} · {unitLabel}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
              {steps.map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-[13px]">
                  <span
                    className={cx(
                      "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                      s.done ? "bg-paper text-ink" : "border border-paper/40 text-paper/50"
                    )}
                  >
                    {s.done ? <Check size={11} /> : <CircleDashed size={11} />}
                  </span>
                  <span className={s.done ? "text-paper" : "text-paper/60"}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="grid lg:grid-cols-[1fr_400px] gap-6 mt-6 items-start">
          <div className="space-y-6">
            {b.status !== "CANCELLED" && (
              <>
                <Reveal delay={60}>
                  <KycUpload reference={b.reference} email={email} docs={portal.kyc} />
                </Reveal>
                <Reveal delay={100}>
                  <AgreementSigner
                    reference={b.reference}
                    email={email}
                    templateText={portal.agreementTemplate?.body ?? null}
                    signed={portal.signed}
                  />
                </Reveal>
                {(b.status === "CONFIRMED" || b.status === "CHECKED_IN") && (
                  <Reveal delay={140}>
                    <StudioBooker
                      reference={b.reference}
                      email={email}
                      checkIn={b.checkIn}
                      checkOut={b.checkOut}
                      slots={portal.slots}
                    />
                  </Reveal>
                )}
              </>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24">
            <Reveal delay={80}>
              <div className="rounded-3xl border border-line bg-paper p-6">
                <p className="kicker text-ink-soft">Summary</p>
                <div className="mt-4 space-y-2.5 text-sm">
                  {b.priceBreakdown.map((l, i) => (
                    <div key={i} className="flex justify-between gap-3">
                      <span className="text-ink-soft leading-snug">
                        {l.qty > 1 ? `${l.qty} × ` : ""}
                        {l.label}
                      </span>
                      <span className="shrink-0">{pkr(l.subtotalPkr)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-end pt-3 border-t border-line">
                    <span className="text-ink-soft">Total</span>
                    <span className="font-display font-extrabold text-2xl tracking-tight">{pkr(b.totalPkr)}</span>
                  </div>
                </div>
                {!paid && payment && b.status !== "CANCELLED" && (
                  <div className="mt-5 rounded-2xl bg-mist p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <Wallet size={15} /> Payment pending — {pkr(payment.amountPkr)}
                    </p>
                    <p className="text-[12.5px] text-ink-soft mt-2 leading-relaxed">
                      {METHOD_HELP[payment.method]}
                    </p>
                  </div>
                )}
                {paid && (
                  <p className="mt-5 flex items-center gap-2 text-sm font-semibold">
                    <Check size={15} /> Payment received
                  </p>
                )}
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="rounded-3xl bg-mist p-6">
                <p className="flex items-center gap-2 font-semibold text-sm">
                  <BadgePercent size={16} /> Resident perks — {discount}% off workshops
                </p>
                <p className="text-[12.5px] text-ink-soft mt-2 leading-relaxed">
                  Use reference <span className="font-mono">{b.reference}</span> when registering
                  and the discount is applied automatically after verification.
                </p>
                <div className="mt-4 space-y-2">
                  {upcomingEvents.slice(0, 3).map((e) => (
                    <Link
                      key={e.id}
                      href={`/events/${e.slug}`}
                      className="block rounded-xl bg-paper border border-line px-4 py-3 text-sm font-medium hover:border-ink transition-colors"
                    >
                      {e.title}
                      <span className="block text-[11.5px] text-ink-soft font-normal mt-0.5">
                        {e.startDate ? formatDate(e.startDate) : "Dates announced soon"} ·{" "}
                        {e.ticketPkr > 0 ? `${pkr(e.ticketPkr)} less ${discount}%` : "Free"}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </Reveal>
          </aside>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
