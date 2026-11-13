import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { CalendarDays, Home, Ticket, Users } from "lucide-react";
import { db } from "@/db";
import { events, passes } from "@/db/schema";
import { formatDate, pkr } from "@/lib/utils";
import PassKycUpload from "@/components/booking/pass-kyc";

export const metadata: Metadata = { title: "Your pass", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  PENDING: "Waiting for our call",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked in",
  CANCELLED: "Cancelled",
};

export default async function PassPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { reference } = await params;
  const { email = "" } = await searchParams;
  const [p] = await db.select().from(passes).where(eq(passes.reference, reference.toUpperCase())).limit(1);
  const okay = p && email && p.email.toLowerCase() === email.trim().toLowerCase();

  if (!okay) {
    return (
      <div className="px-5 py-24 text-center">
        <h1 className="display-md">Booking not found</h1>
        <p className="text-ink-soft mt-3">Open the link from your email, or message us on WhatsApp with your reference.</p>
        <Link href="/book" className="btn btn-primary mt-8">Book a pass</Link>
      </div>
    );
  }
  const ev = p.eventId ? (await db.select().from(events).where(eq(events.id, p.eventId)).limit(1))[0] : null;
  const what = ev ? ev.title : "Content Colony pass";

  return (
    <div className="px-5 md:px-10 py-14 md:py-20">
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="rounded-3xl bg-ink text-paper p-7 md:p-9">
          <p className="kicker text-paper/50">Your pass · {STATUS[p.status] ?? p.status}</p>
          <p className="font-display font-extrabold text-3xl md:text-4xl tracking-tight mt-3 select-all">{p.reference}</p>
          <div className="mt-6 grid sm:grid-cols-2 gap-3 text-sm text-paper/80">
            <p className="flex items-center gap-2"><Ticket size={15} /> {what}</p>
            <p className="flex items-center gap-2"><CalendarDays size={15} /> {formatDate(p.visitDate)}</p>
            <p className="flex items-center gap-2"><Users size={15} /> {p.guestsCount} {p.guestsCount === 1 ? "guest" : "guests"}</p>
            {p.amountPkr > 0 && <p>{pkr(p.amountPkr)}{p.paidPkr > 0 ? ` · paid ${pkr(p.paidPkr)}` : ""}</p>}
            {p.wantsStay && (
              <p className="flex items-center gap-2 sm:col-span-2">
                <Home size={15} /> Stay request: {p.stayFrom ? formatDate(p.stayFrom) : ""} → {p.stayTo ? formatDate(p.stayTo) : ""} · we confirm on the call
              </p>
            )}
          </div>
        </div>
        {p.status === "PENDING" && (
          <p className="rounded-2xl bg-mist p-5 text-sm leading-relaxed">
            Our team will call or WhatsApp you on <b>{p.whatsapp}</b> to confirm your booking and payment.
          </p>
        )}
        {p.status !== "CANCELLED" && (
          <PassKycUpload
            reference={p.reference}
            email={p.email}
            uploaded={p.kycUploadedAt ? { docType: p.kycDocType ?? "ID", fileName: p.kycFileName ?? "" } : null}
          />
        )}
      </div>
    </div>
  );
}
