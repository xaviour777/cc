import Link from "next/link";
import { desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { bookings, events, passes, type Pass } from "@/db/schema";
import { AdminBadge } from "@/components/admin/form-shell";
import { AddPassIdButton, CancelPassButton, CheckInPassButton, ConfirmPassButton } from "@/components/admin/pass-buttons";
import { formatDate, pkr, todayISO } from "@/lib/utils";
import { siteUrl } from "@/lib/members";
import { ghlConfigured } from "@/lib/ghl";

export const dynamic = "force-dynamic";

const wa = (n: string) => n.replace(/\D/g, "").replace(/^0/, "92");

function Row({ p, eventTitle, stayId }: { p: Pass; eventTitle: string | null; stayId?: number }) {
  const kycLink = `${siteUrl()}/pass/${p.reference}?email=${encodeURIComponent(p.email)}`;
  const waText =
    p.status === "PENDING"
      ? `Assalam-o-alaikum ${p.name}! Content Colony se baat kar rahe hain — aapki booking ${p.reference} (${formatDate(p.visitDate)}) confirm karni thi.`
      : `Assalam-o-alaikum ${p.name}! Check-in se pehle apna CNIC / ID yahan add kar dein: ${kycLink}`;
  return (
    <div className="p-5 border-b border-line last:border-0 hover:bg-mist/60 transition-colors">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-60">
          <p className="font-medium">
            {p.name} <span className="text-ink-soft font-normal">· {p.age ?? "?"} yrs{p.gender ? ` · ${p.gender}` : ""}</span>{" "}
            <span className="font-mono text-[12px] text-ink-soft">· {p.reference}</span>
          </p>
          <p className="text-[13px] mt-0.5">
            {eventTitle ?? "Community Day Pass"}{p.tierName ? ` · ${p.tierName}` : ""}{p.dayPass ? " (day pass)" : ""} · {formatDate(p.visitDate)} · {p.guestsCount} {p.guestsCount === 1 ? "guest" : "guests"}
            {p.amountPkr > 0 ? ` · ${pkr(p.amountPkr)}` : ""}
            {p.paidPkr > 0 ? ` · paid ${pkr(p.paidPkr)}` : ""}
          </p>
          <p className="text-[12.5px] text-ink-soft mt-1 flex flex-wrap gap-x-3 gap-y-1">
            <a className="underline underline-offset-2" href={`tel:${p.phone}`}>{p.phone}</a>
            <a className="underline underline-offset-2" target="_blank" rel="noreferrer" href={`https://wa.me/${wa(p.whatsapp)}?text=${encodeURIComponent(waText)}`}>
              WhatsApp {p.whatsapp}
            </a>
            <a className="underline underline-offset-2" href={`mailto:${p.email}`}>{p.email}</a>
          </p>
          {p.wantsStay && (
            <p className="text-[12.5px] mt-1.5">
              🏠 Wants to stay{p.city ? ` (from ${p.city})` : ""}: {p.stayKey === "PRIVATE_ROOM" ? "private room" : "bunk"}, {p.stayNights} nights
              {p.stayBookingRef ? (
                <> · held as {stayId ? <Link className="underline underline-offset-2" href={`/admin/bookings/${stayId}`}>{p.stayBookingRef}</Link> : p.stayBookingRef}</>
              ) : null}
            </p>
          )}
          {p.notes && <p className="text-[12px] text-ink-soft mt-1 whitespace-pre-line">{p.notes}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <AdminBadge tone={p.status === "CONFIRMED" || p.status === "CHECKED_IN" ? "dark" : "neutral"}>
            {p.status === "PENDING" ? "To call" : p.status.replace(/_/g, " ")}
          </AdminBadge>
          {p.kycUploadedAt ? (
            <a className="text-[12px] underline underline-offset-2" target="_blank" rel="noreferrer" href={`/api/pass-kyc/${p.id}`}>
              View ID ({p.kycDocType})
            </a>
          ) : (
            <span className="text-[12px] text-ink-soft">No ID yet</span>
          )}
        </div>
      </div>
      {p.status !== "CANCELLED" && p.status !== "CHECKED_IN" && (
        <div className="flex flex-wrap gap-2 mt-3">
          {p.status === "PENDING" && <ConfirmPassButton id={p.id} amount={p.amountPkr} />}
          {p.status === "CONFIRMED" && p.kycUploadedAt && <CheckInPassButton id={p.id} />}
          {!p.kycUploadedAt && <AddPassIdButton id={p.id} />}
          <CancelPassButton id={p.id} />
        </div>
      )}
    </div>
  );
}

export default async function PassesPage() {
  const today = todayISO();
  const rows = await db.select().from(passes).orderBy(passes.visitDate, desc(passes.createdAt)).limit(400);
  const ids = [...new Set(rows.map((r) => r.eventId).filter((x): x is number => x !== null))];
  const evs = ids.length ? await db.select({ id: events.id, title: events.title }).from(events).where(inArray(events.id, ids)) : [];
  const refs = rows.map((r) => r.stayBookingRef).filter((x): x is string => Boolean(x));
  const stays = refs.length ? await db.select({ id: bookings.id, ref: bookings.reference }).from(bookings).where(inArray(bookings.reference, refs)) : [];
  const title = (p: Pass) => (p.eventId ? evs.find((e) => e.id === p.eventId)?.title ?? "Event" : null);

  const toCall = rows.filter((p) => p.status === "PENDING" && p.visitDate >= today);
  const todays = rows.filter((p) => p.visitDate === today && p.status !== "PENDING" && p.status !== "CANCELLED");
  const upcoming = rows.filter((p) => p.visitDate > today && p.status === "CONFIRMED");
  const past = rows
    .filter((p) => p.visitDate < today || p.status === "CANCELLED")
    .sort((a, b) => (a.visitDate < b.visitDate ? 1 : -1))
    .slice(0, 40);

  const section = (name: string, list: Pass[], empty: string) => (
    <>
      <h2 className="font-display font-bold text-xl tracking-tight mt-8">
        {name} <span className="text-ink-soft font-normal text-base">({list.length})</span>
      </h2>
      <div className="mt-3 rounded-2xl border border-line bg-paper">
        {list.length === 0 && <p className="p-5 text-sm text-ink-soft">{empty}</p>}
        {list.map((p) => (
          <Row key={p.id} p={p} eventTitle={title(p)} stayId={stays.find((b) => b.ref === p.stayBookingRef)?.id} />
        ))}
      </div>
    </>
  );

  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl tracking-tight">Passes</h1>
      <p className="text-sm text-ink-soft mt-1">
        Workshop passes (full and day passes) from <Link className="underline" href="/book">/book</Link>. Call or
        WhatsApp each new request, take payment, then press Confirm. Guests add ID from their email link; check them in at the door.
      </p>
      {!ghlConfigured() && (
        <p className="mt-4 rounded-2xl bg-mist p-4 text-[13px]">
          GoHighLevel is not connected yet, so opportunities are not being created. Add GHL_API_KEY and GHL_LOCATION_ID
          (and optionally GHL_PIPELINE_ID) in Vercel, then press &quot;Retry GHL syncs&quot; on the Dashboard to send the waiting leads.
        </p>
      )}
      {section("New requests — call these", toCall, "No new requests. 🎉")}
      {section("Today at the Colony", todays, "Nobody booked for today.")}
      {section("Upcoming confirmed", upcoming, "No upcoming confirmed passes.")}
      {section("Past & cancelled", past, "Nothing here yet.")}
    </div>
  );
}
