"use server";

import crypto from "crypto";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { eventRegistrations, events, passes } from "@/db/schema";
import { createBooking, getSetting } from "@/lib/stays";
import { queueLeadSync, recordNotification, teamInbox } from "@/lib/ghl";
import { saveKycFile } from "@/lib/kyc-storage";
import { siteUrl } from "@/lib/members";
import { addDaysISO, genReference, isISODate, maskIdNumber, todayISO } from "@/lib/utils";

const digits = (s: string) => s.replace(/\D/g, "");
const fmt = (n: number) => `PKR ${n.toLocaleString("en-PK")}`;

export type PassInput = {
  kind: "DAY_PASS" | "EVENT";
  eventSlug?: string;
  visitDate: string;
  name: string;
  age: number;
  phone: string;
  whatsapp: string;
  email: string;
  city?: string;
  guestsCount: number;
  stay?: { key: "SHARED_BUNK" | "PRIVATE_ROOM"; nights: number } | null;
  utm?: Record<string, string>;
  honeypot?: string;
};

export async function submitPass(input: PassInput) {
  if (input.honeypot) return { ok: false as const, error: "Something went wrong." };
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const whatsapp = (input.whatsapp || input.phone).trim();
  const guests = Math.max(1, Math.min(10, Math.round(Number(input.guestsCount) || 1)));
  const age = Math.round(Number(input.age) || 0);

  if (name.length < 2) return { ok: false as const, error: "Apna poora naam likhein (please enter your full name)." };
  if (!age || age < 10 || age > 100) return { ok: false as const, error: "Please enter your age." };
  if (digits(phone).length < 10) return { ok: false as const, error: "Please enter a valid phone number." };
  if (digits(whatsapp).length < 10) return { ok: false as const, error: "Please enter a valid WhatsApp number." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false as const, error: "Please enter a valid email address." };

  let visitDate = input.visitDate;
  let amount = 0;
  let event: typeof events.$inferSelect | null = null;

  if (input.kind === "EVENT") {
    const rows = await db.select().from(events).where(eq(events.slug, input.eventSlug ?? "")).limit(1);
    event = rows[0] ?? null;
    if (!event || event.status !== "PUBLISHED")
      return { ok: false as const, error: "This workshop / event is not open for booking right now." };
    if (event.startDate && event.startDate >= todayISO()) visitDate = event.startDate;
    const taken = await db
      .select({ count: sql<number>`count(*)` })
      .from(eventRegistrations)
      .where(and(eq(eventRegistrations.eventId, event.id), ne(eventRegistrations.status, "CANCELLED")));
    if (Number(taken[0]?.count ?? 0) + guests > event.capacity)
      return { ok: false as const, error: "Sorry, not enough seats left for this one. Try another date or event." };
    amount = event.ticketPkr * guests;
  } else {
    amount = Number(await getSetting<number>("dayPassPkr", 0)) * guests;
  }
  if (!isISODate(visitDate) || visitDate < todayISO())
    return { ok: false as const, error: "Please pick a date from today onwards." };

  // Workshop seats count against the event's capacity and show in reports.
  let registrationId: number | null = null;
  if (event) {
    const [reg] = await db
      .insert(eventRegistrations)
      .values({
        eventId: event.id,
        name,
        email,
        phone: whatsapp,
        pricePkr: event.ticketPkr,
        amountDuePkr: amount,
        status: "PENDING_PAYMENT",
      })
      .returning({ id: eventRegistrations.id });
    registrationId = reg.id;
  }

  const reference = genReference("CP");
  const [pass] = await db
    .insert(passes)
    .values({
      reference,
      kind: input.kind,
      eventId: event?.id ?? null,
      registrationId,
      visitDate,
      name,
      age,
      phone,
      whatsapp,
      email,
      city: input.city?.trim() || null,
      guestsCount: guests,
      amountPkr: amount,
      wantsStay: Boolean(input.stay),
      stayKey: input.stay?.key ?? null,
      stayNights: input.stay?.nights ?? null,
      utm: input.utm && Object.keys(input.utm).length ? input.utm : null,
    })
    .returning();

  // Optional stay add-on: hold a real bed/room so nobody else takes it.
  let stay: { reference: string; totalPkr: number; nights: number } | null = null;
  let stayNote = "";
  if (input.stay) {
    const nights = Math.max(1, Math.min(30, Math.round(input.stay.nights || 3)));
    const res = await createBooking({
      accommodationKey: input.stay.key,
      checkIn: visitDate,
      checkOut: addDaysISO(visitDate, nights),
      guestName: name,
      guestEmail: email,
      guestPhone: whatsapp,
      guestsCount: 1,
      paymentMethod: "BANK_TRANSFER",
      source: `pass ${reference}`,
    });
    if (res.ok) {
      stay = { reference: res.reference, totalPkr: res.totalPkr, nights: res.nights };
      await db.update(passes).set({ stayBookingRef: res.reference, stayNights: res.nights }).where(eq(passes.id, pass.id));
    } else {
      stayNote = `Stay could not be held automatically (${res.error}) — please arrange it on the call.`;
      await db.update(passes).set({ notes: stayNote }).where(eq(passes.id, pass.id));
    }
  }

  const what = event ? `${event.title} pass` : "Community Day Pass";
  const stayLabel = input.stay
    ? `${input.stay.key === "SHARED_BUNK" ? "Shared bunk" : "Private room"}, ${stay?.nights ?? input.stay.nights} nights from ${visitDate}`
    : "";
  const portal = `${siteUrl()}/pass/${reference}?email=${encodeURIComponent(email)}`;
  const waNumber = digits(whatsapp).replace(/^0/, "92");

  // CRM: contact + opportunity in GoHighLevel (no-op until keys are set).
  await queueLeadSync({
    entityType: "pass",
    entityId: pass.id,
    name,
    email,
    phone: whatsapp,
    tags: [
      "content-colony",
      event ? "workshop-pass" : "day-pass",
      ...(input.stay ? ["stay-addon"] : []),
      ...(input.city?.trim() ? ["out-of-city"] : []),
    ],
    source: `Content Colony — ${what}`,
    notes: `Ref ${reference} · ${visitDate} · ${guests} guest(s)`,
    utm: input.utm ?? null,
    opportunity: {
      name: `${name} — ${what}${input.stay ? " + stay" : ""} (${visitDate})`,
      monetaryValue: amount + (stay?.totalPkr ?? 0),
    },
  });

  // Team alert
  await recordNotification({
    channel: "EMAIL",
    to: await teamInbox(),
    copyTeam: false,
    subject: `New booking: ${what} — ${name} (${visitDate})`,
    body: [
      `New ${what} request. Please call / WhatsApp to confirm and take payment.`,
      ``,
      `Reference: ${reference}`,
      `Name: ${name}`,
      `Age: ${age}`,
      `Phone: ${phone}`,
      `WhatsApp: ${whatsapp}  (https://wa.me/${waNumber})`,
      `Email: ${email}`,
      input.city?.trim() ? `Coming from: ${input.city.trim()}` : null,
      `Date: ${visitDate}`,
      `Guests: ${guests}`,
      `Amount: ${amount > 0 ? fmt(amount) : "to share on call"}`,
      input.stay ? `Stay add-on: ${stayLabel}${stay ? ` · booking ${stay.reference} · ${stay.totalPkr ? fmt(stay.totalPkr) : "price to agree"}` : ""}` : null,
      stayNote || null,
      ``,
      `Open in admin: ${siteUrl()}/admin/passes`,
    ]
      .filter((l) => l !== null)
      .join("\n"),
    entityType: "pass",
    entityId: pass.id,
  });

  // Guest confirmation
  await recordNotification({
    channel: "EMAIL",
    to: email,
    copyTeam: false,
    subject: `We got your booking ${reference} — Content Colony`,
    body: [
      `Assalam-o-alaikum ${name}!`,
      ``,
      `Shukriya — we received your ${what} request for ${visitDate} (${guests} ${guests === 1 ? "guest" : "guests"}).`,
      `Our team will call or WhatsApp you shortly to confirm your booking and payment.`,
      input.stay ? `\nYour stay: ${stayLabel}. Ghar jaisa mahol, apne jaise log — we'll sort everything on the call.` : null,
      ``,
      `Before you arrive, please add your ID (CNIC / passport) here — it makes check-in quick:`,
      portal,
      ``,
      `Your people are here.`,
      `— Team Content Colony`,
    ]
      .filter((l) => l !== null)
      .join("\n"),
    entityType: "pass",
    entityId: pass.id,
  });

  return {
    ok: true as const,
    reference,
    visitDate,
    amount,
    what,
    stay,
    stayNote,
    portal: `/pass/${reference}?email=${encodeURIComponent(email)}`,
  };
}

// ---------- Guest pass page ----------
async function findPass(reference: string, email: string) {
  const [p] = await db
    .select()
    .from(passes)
    .where(eq(passes.reference, reference.trim().toUpperCase()))
    .limit(1);
  if (!p || p.email.toLowerCase() !== email.trim().toLowerCase()) return null;
  return p;
}

export async function uploadPassKyc(formData: FormData) {
  const pass = await findPass(String(formData.get("reference") ?? ""), String(formData.get("email") ?? ""));
  if (!pass) return { ok: false as const, error: "We couldn't find this booking." };
  if (pass.status === "CANCELLED") return { ok: false as const, error: "This booking was cancelled." };
  const docType = String(formData.get("docType") ?? "");
  const idNumber = String(formData.get("idNumber") ?? "");
  const file = formData.get("file") as File | null;
  if (!["CNIC", "NICOP", "PASSPORT", "B_FORM"].includes(docType))
    return { ok: false as const, error: "Choose a document type." };
  if (!file || file.size === 0) return { ok: false as const, error: "Attach a photo or scan of the document." };
  if (file.size > 4 * 1024 * 1024) return { ok: false as const, error: "File is too large (max 4 MB)." };
  if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type))
    return { ok: false as const, error: "Upload a JPG, PNG, WEBP or PDF." };

  const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1];
  const name = `pass-${pass.id}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
  const filePath = await saveKycFile(name, file.type, Buffer.from(await file.arrayBuffer()));
  await db
    .update(passes)
    .set({
      kycDocType: docType,
      kycIdLast4: maskIdNumber(idNumber) || null,
      kycFilePath: filePath,
      kycFileName: file.name,
      kycMime: file.type,
      kycUploadedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(passes.id, pass.id));
  await recordNotification({
    channel: "EMAIL",
    to: await teamInbox(),
    copyTeam: false,
    subject: `ID added — ${pass.reference} (${pass.name})`,
    body: `${pass.name} added a ${docType} for pass ${pass.reference} (${pass.visitDate}). See Admin → Passes.`,
    entityType: "pass",
    entityId: pass.id,
  });
  return { ok: true as const };
}
