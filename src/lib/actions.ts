"use server";

import crypto from "crypto";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  accommodationTypes,
  agreements,
  bookings,
  eventProposals,
  eventRegistrations,
  events,
  kycDocuments,
  payments,
  signedAgreements,
  studioReservations,
} from "@/db/schema";
import {
  createBooking,
  getAvailability,
  getAvailabilityCalendar,
  getHidePrices,
  getMinStayNights,
  getPlansFor,
  getSetting,
  isActiveResident,
  quoteStay,
  verifyResidentReference,
  bookingByReference,
} from "@/lib/stays";
import { queueLeadSync, recordNotification } from "@/lib/ghl";
import { STUDIO_SLOTS } from "@/lib/studio";
import { saveKycFile } from "@/lib/kyc-storage";
import { isISODate, maskIdNumber, nightsBetween, todayISO } from "@/lib/utils";

// ---------- Availability + quotes for the booking widget ----------
export async function checkStayAvailability(checkIn: string, checkOut: string) {
  if (!isISODate(checkIn) || !isISODate(checkOut))
    return { ok: false as const, error: "Choose valid dates." };
  const nights = nightsBetween(checkIn, checkOut);
  const minStay = await getMinStayNights();
  if (nights < 1 || checkIn < todayISO())
    return { ok: false as const, error: "Choose valid dates." };

  const types = await db
    .select()
    .from(accommodationTypes)
    .where(eq(accommodationTypes.active, true));
  const [availability, hidePrices] = await Promise.all([
    getAvailability(checkIn, checkOut),
    getHidePrices(),
  ]);

  const products = await Promise.all(
    types.map(async (t) => {
      const plans = await getPlansFor(t.id);
      const quote = quoteStay(plans, nights, 1); // quote any length, min-stay enforced at confirm
      const nightly = plans.find((p) => p.unitNights === 1)?.pricePkr ?? 0;
      const avail = availability.find((a) => a.key === t.key);
      return {
        key: t.key,
        name: t.name,
        nightlyPkr: hidePrices ? 0 : nightly,
        available: avail?.availableUnits ?? 0,
        total: avail?.totalUnits ?? 0,
        quote:
          quote.ok && !hidePrices
            ? { totalPkr: quote.totalPkr, lines: quote.lines }
            : null,
      };
    })
  );

  return {
    ok: true as const,
    nights,
    minStay,
    minStayMessage:
      "Good things take time. Stay at least 3 nights and feel at home.",
    products,
  };
}

// ---------- Month calendar for the booking widget ----------
export async function getStayCalendar(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) return [];
  const first = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return getAvailabilityCalendar(first, days);
}

// ---------- Create booking ----------
export async function submitBooking(input: {
  accommodationKey: "SHARED_BUNK" | "PRIVATE_ROOM";
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestsCount: number;
  paymentMethod: "BANK_TRANSFER" | "RAAST" | "CARD_LINK" | "CASH_ON_ARRIVAL";
  utm?: Record<string, string>;
  honeypot?: string;
}) {
  if (input.honeypot) return { ok: false as const, error: "Something went wrong." };
  const result = await createBooking(input);
  if (!result.ok) return result;

  await queueLeadSync({
    entityType: "booking",
    entityId: result.bookingId,
    name: input.guestName,
    email: input.guestEmail,
    phone: input.guestPhone,
    tags: ["content-colony", "booking-enquiry", input.accommodationKey.toLowerCase()],
    source: "Content Colony — Booking",
    notes: `Ref ${result.reference} · ${input.checkIn} → ${input.checkOut} · ${
      result.pricePending ? "pre-booking, price to agree" : `PKR ${result.totalPkr}`
    }`,
    utm: input.utm ?? null,
  });
  await recordNotification({
    channel: "EMAIL",
    to: input.guestEmail,
    subject: `Your Content Colony booking request ${result.reference}`,
    body: result.pricePending
      ? `Assalam-o-alaikum ${input.guestName}! We received your pre-booking request (${result.reference}) for ${input.checkIn} → ${input.checkOut}, ${result.nights} nights. Our team will reach out on WhatsApp with your price.`
      : `Assalam-o-alaikum ${input.guestName}! We received your booking request (${result.reference}) for ${input.checkIn} → ${input.checkOut}, ${result.nights} nights, total PKR ${result.totalPkr}. Complete verification and payment via your booking page.`,
    entityType: "booking",
    entityId: result.bookingId,
  });

  return result;
}

// ---------- Event registration (server-validated resident discount) ----------
export async function registerForEvent(input: {
  eventSlug: string;
  name: string;
  email: string;
  phone: string;
  bookingReference?: string;
  honeypot?: string;
}) {
  if (input.honeypot) return { ok: false as const, error: "Something went wrong." };
  const rows = await db.select().from(events).where(eq(events.slug, input.eventSlug)).limit(1);
  const event = rows[0];
  if (!event || event.status === "DRAFT" || event.status === "CANCELLED")
    return { ok: false as const, error: "This event is not open for registration." };
  if (!input.name.trim() || !/^\S+@\S+\.\S+$/.test(input.email))
    return { ok: false as const, error: "Please enter your name and a valid email." };
  if (input.phone.replace(/\D/g, "").length < 9)
    return { ok: false as const, error: "Please enter a valid WhatsApp number." };

  // Seats (capacity is enforced on non-cancelled registrations)
  const takenRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(eventRegistrations)
    .where(and(eq(eventRegistrations.eventId, event.id), ne(eventRegistrations.status, "CANCELLED")));
  const taken = Number(takenRows[0]?.count ?? 0);
  if (taken >= event.capacity)
    return { ok: false as const, error: "This event is full. Join the next one!" };

  // Duplicate guard
  const dupe = await db
    .select({ id: eventRegistrations.id })
    .from(eventRegistrations)
    .where(
      and(
        eq(eventRegistrations.eventId, event.id),
        eq(eventRegistrations.email, input.email.toLowerCase()),
        ne(eventRegistrations.status, "CANCELLED")
      )
    )
    .limit(1);
  if (dupe.length > 0)
    return { ok: false as const, error: "You're already registered for this event." };

  // Resident discount — verified against an active booking, never self-declared
  let discountPct = 0;
  let isResident = false;
  if (input.bookingReference?.trim()) {
    const booking = await verifyResidentReference(input.bookingReference, input.email);
    if (!booking)
      return {
        ok: false as const,
        error: "We couldn't verify that booking reference with this email.",
      };
    if (!isActiveResident(booking))
      return {
        ok: false as const,
        error: "That stay isn't active anymore — resident discounts need a current booking.",
      };
    isResident = true;
    discountPct = event.residentDiscountPct ?? (await getSetting<number>("residentDiscountPct", 25));
  }

  const amountDue = isResident
    ? Math.round((event.ticketPkr * (100 - discountPct)) / 100)
    : event.ticketPkr;

  const [reg] = await db
    .insert(eventRegistrations)
    .values({
      eventId: event.id,
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      phone: input.phone.trim(),
      isResident,
      bookingReference: input.bookingReference?.trim().toUpperCase() || null,
      discountPct,
      pricePkr: event.ticketPkr,
      amountDuePkr: amountDue,
      status: amountDue > 0 ? "PENDING_PAYMENT" : "CONFIRMED",
    })
    .returning({ id: eventRegistrations.id });

  if (amountDue > 0) {
    // Outstanding ticket revenue is visible to admin as a pending payment.
    await db.insert(payments).values({
      eventRegistrationId: reg.id,
      kind: "TICKET",
      method: "BANK_TRANSFER",
      amountPkr: amountDue,
      status: "PENDING",
    });
  }

  await queueLeadSync({
    entityType: "registration",
    entityId: reg.id,
    name: input.name,
    email: input.email,
    phone: input.phone,
    tags: ["content-colony", "event-registration", event.category.toLowerCase().replace(/\s+/g, "-")],
    source: `Content Colony — Event: ${event.title}`,
    notes: `Event: ${event.title} · ${isResident ? `resident ${discountPct}% off` : "standard"} · due PKR ${amountDue}`,
  });
  await recordNotification({
    channel: "EMAIL",
    to: input.email,
    subject: `You're in: ${event.title}`,
    body: `Salam ${input.name}! Your seat at "${event.title}" is ${amountDue > 0 ? `reserved — PKR ${amountDue} due` : "confirmed (free entry)"}. Event status and reminders will be shared closer to the date.`,
    entityType: "registration",
    entityId: reg.id,
  });

  return {
    ok: true as const,
    registrationId: reg.id,
    amountDue,
    discountPct,
    free: amountDue === 0,
  };
}

// ---------- Partner event proposal ----------
export async function submitProposal(input: {
  organizerName: string;
  email: string;
  whatsapp: string;
  brand?: string;
  socialUrl?: string;
  title: string;
  category: string;
  description: string;
  preferredDate?: string;
  expectedAttendees?: number;
  ticketSuggestion?: string;
  requirements?: string;
  speakerBio?: string;
  coverImage?: string;
  honeypot?: string;
}) {
  if (input.honeypot) return { ok: false as const, error: "Something went wrong." };
  if (input.organizerName.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(input.email))
    return { ok: false as const, error: "Please add your name and a valid email." };
  if (input.title.trim().length < 4 || input.description.trim().length < 20)
    return { ok: false as const, error: "Give the event a title and a little more description." };

  const [row] = await db
    .insert(eventProposals)
    .values({
      organizerName: input.organizerName.trim(),
      email: input.email.toLowerCase().trim(),
      whatsapp: input.whatsapp.trim(),
      brand: input.brand?.trim() || null,
      socialUrl: input.socialUrl?.trim() || null,
      title: input.title.trim(),
      category: input.category,
      description: input.description.trim(),
      preferredDate: input.preferredDate && isISODate(input.preferredDate) ? input.preferredDate : null,
      expectedAttendees: input.expectedAttendees ?? null,
      ticketSuggestion: input.ticketSuggestion?.trim() || null,
      requirements: input.requirements?.trim() || null,
      speakerBio: input.speakerBio?.trim() || null,
      coverImage: input.coverImage?.trim() || null,
    })
    .returning({ id: eventProposals.id });

  await queueLeadSync({
    entityType: "proposal",
    entityId: row.id,
    name: input.organizerName,
    email: input.email,
    phone: input.whatsapp,
    tags: ["content-colony", "partner-proposal"],
    source: "Content Colony — Host an Event",
    notes: `Proposal: ${input.title} (${input.category})`,
  });
  return { ok: true as const, id: row.id };
}

// ---------- Contact ----------
export async function submitContact(input: {
  name: string;
  email: string;
  phone?: string;
  topic: string;
  message: string;
  honeypot?: string;
}) {
  if (input.honeypot) return { ok: false as const, error: "Something went wrong." };
  if (input.name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(input.email) || input.message.trim().length < 4)
    return { ok: false as const, error: "Please add your name, email and a message." };
  const id = await queueLeadSync({
    entityType: "contact",
    entityId: Date.now() % 2_000_000_000,
    name: input.name,
    email: input.email,
    phone: input.phone,
    tags: ["content-colony", "contact-form"],
    source: `Content Colony — Contact (${input.topic})`,
    notes: input.message.slice(0, 500),
  });
  await recordNotification({
    channel: "EMAIL",
    to: input.email,
    subject: "We got your message — Content Colony",
    body: `Thanks ${input.name}, we received your message about "${input.topic}" and will reply soon.`,
  });
  return { ok: true as const, id };
}

// ---------- Join the Colony interest ----------
export async function joinColony(input: { name: string; email: string; interest: string; honeypot?: string }) {
  if (input.honeypot) return { ok: false as const, error: "Something went wrong." };
  if (input.name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(input.email))
    return { ok: false as const, error: "Add your name and a valid email." };
  await queueLeadSync({
    entityType: "contact",
    entityId: Date.now() % 2_000_000_000,
    name: input.name,
    email: input.email,
    tags: ["content-colony", "community-interest"],
    source: "Content Colony — Join the Colony",
    notes: `Interest: ${input.interest}`,
  });
  return { ok: true as const };
}

// ---------- Booking portal ----------
export async function getPortal(reference: string, email: string) {
  const booking = await verifyResidentReference(reference, email);
  if (!booking) return { ok: false as const, error: "No booking found with that reference and email." };
  const [kyc, signed, slots, agreementRows, typeRows] = await Promise.all([
    db.select().from(kycDocuments).where(eq(kycDocuments.bookingId, booking.id)).orderBy(desc(kycDocuments.createdAt)),
    db.select().from(signedAgreements).where(eq(signedAgreements.bookingId, booking.id)).orderBy(desc(signedAgreements.id)),
    db.select().from(studioReservations).where(eq(studioReservations.bookingId, booking.id)).orderBy(desc(studioReservations.date)),
    db.select().from(agreements).orderBy(desc(agreements.version)).limit(1),
    db.select().from(accommodationTypes).where(eq(accommodationTypes.id, booking.accommodationTypeId)).limit(1),
  ]);
  return {
    ok: true as const,
    booking,
    typeName: typeRows[0]?.name ?? "Stay",
    kyc: kyc.map((k) => ({
      id: k.id,
      docType: k.docType,
      status: k.status,
      fileName: k.fileName,
      reviewNote: k.reviewNote,
    })),
    agreementTemplate: agreementRows[0] ?? null,
    signed: signed[0]
      ? { id: signed[0].id, version: signed[0].agreementVersion, at: signed[0].signedAt }
      : null,
    slots: slots.map((s) => ({ id: s.id, resource: s.resource, date: s.date, slot: s.slot, status: s.status })),
  };
}

export async function uploadKyc(formData: FormData) {
  const reference = String(formData.get("reference") ?? "");
  const email = String(formData.get("email") ?? "");
  const docType = String(formData.get("docType") ?? "");
  const idNumber = String(formData.get("idNumber") ?? "");
  const file = formData.get("file") as File | null;

  const booking = await verifyResidentReference(reference, email);
  if (!booking) return { ok: false as const, error: "Booking verification failed." };
  if (!["CNIC", "NICOP", "PASSPORT"].includes(docType))
    return { ok: false as const, error: "Choose a document type." };
  if (!file || file.size === 0) return { ok: false as const, error: "Attach a photo or scan of the document." };
  if (file.size > 8 * 1024 * 1024) return { ok: false as const, error: "File is too large (max 8 MB)." };
  if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type))
    return { ok: false as const, error: "Upload a JPG, PNG, WEBP or PDF." };

  const safeName = `${booking.id}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1];
  const filePath = await saveKycFile(`${safeName}.${ext}`, file.type, Buffer.from(await file.arrayBuffer()));

  await db.insert(kycDocuments).values({
    bookingId: booking.id,
    docType,
    idNumberLast4: maskIdNumber(idNumber),
    filePath,
    fileName: file.name,
    mime: file.type,
    sizeBytes: file.size,
    status: "PENDING",
  });
  return { ok: true as const };
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "—");
}

export async function signStayAgreement(input: {
  reference: string;
  email: string;
  signerName: string;
  consent: boolean;
}) {
  const booking = await verifyResidentReference(input.reference, input.email);
  if (!booking) return { ok: false as const, error: "Booking verification failed." };
  if (!input.consent) return { ok: false as const, error: "Please confirm you agree to the terms." };
  if (input.signerName.trim().length < 3)
    return { ok: false as const, error: "Type your full legal name as it appears on your ID." };

  const existing = await db
    .select({ id: signedAgreements.id })
    .from(signedAgreements)
    .where(eq(signedAgreements.bookingId, booking.id))
    .limit(1);
  if (existing.length) return { ok: false as const, error: "This stay agreement is already signed." };

  const tpl = (await db.select().from(agreements).orderBy(desc(agreements.version)).limit(1))[0];
  if (!tpl) return { ok: false as const, error: "No active agreement template." };

  const [typeRow] = await db
    .select()
    .from(accommodationTypes)
    .where(eq(accommodationTypes.id, booking.accommodationTypeId))
    .limit(1);

  const signedAt = new Date();
  const filled = fillTemplate(tpl.body, {
    version: String(tpl.version),
    guest_name: input.signerName.trim(),
    reference: booking.reference,
    check_in: booking.checkIn,
    check_out: booking.checkOut,
    nights: String(booking.nights),
    accommodation: typeRow?.name ?? "Stay",
    total: `PKR ${booking.totalPkr.toLocaleString("en-PK")}`,
    signed_at: signedAt.toLocaleString("en-GB"),
  });
  const html = `<article class="signed-agreement"><h1>${tpl.title}</h1>${filled
    .split("\n\n")
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("")}</article>`;

  await db.insert(signedAgreements).values({
    bookingId: booking.id,
    agreementId: tpl.id,
    agreementVersion: tpl.version,
    signerName: input.signerName.trim(),
    consent: true,
    signedAt,
    ipHash: crypto.createHash("sha256").update(input.reference + signedAt.toISOString()).digest("hex").slice(0, 16),
    documentHtml: html,
  });
  return { ok: true as const };
}

export async function bookStudioSlot(input: {
  reference: string;
  email: string;
  resource: "STUDIO" | "CALL_POD";
  date: string;
  slot: string;
  purpose?: string;
}) {
  const booking = await verifyResidentReference(input.reference, input.email);
  if (!booking) return { ok: false as const, error: "Booking verification failed." };
  if (!isISODate(input.date) || input.date < todayISO() || input.date >= booking.checkOut || input.date < booking.checkIn)
    return { ok: false as const, error: "Pick a date within your stay." };
  if (!STUDIO_SLOTS.includes(input.slot)) return { ok: false as const, error: "Pick a valid slot." };

  const clash = await db
    .select({ id: studioReservations.id })
    .from(studioReservations)
    .where(
      and(
        eq(studioReservations.resource, input.resource),
        eq(studioReservations.date, input.date),
        eq(studioReservations.slot, input.slot),
        ne(studioReservations.status, "CANCELLED")
      )
    )
    .limit(1);
  if (clash.length) return { ok: false as const, error: "That slot is taken — choose another." };

  // Guests hardly ever book PG&E in admin — backfill payments table check skipped.
  const [row] = await db
    .insert(studioReservations)
    .values({
      resource: input.resource,
      date: input.date,
      slot: input.slot,
      bookingId: booking.id,
      name: booking.guestName,
      email: booking.guestEmail,
      purpose: input.purpose?.trim() || null,
      status: "CONFIRMED",
    })
    .returning({ id: studioReservations.id });
  return { ok: true as const, id: row.id };
}

export async function lookupBooking(reference: string) {
  const b = await bookingByReference(reference);
  if (!b) return { ok: false as const, error: "No booking found with that reference." };
  return { ok: true as const };
}
