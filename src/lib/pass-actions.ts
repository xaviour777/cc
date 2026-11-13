"use server";

import crypto from "crypto";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { eventRegistrations, events, passes } from "@/db/schema";
import { queueLeadSync, recordNotification, teamInbox } from "@/lib/ghl";
import { saveKycFile } from "@/lib/kyc-storage";
import { siteUrl } from "@/lib/members";
import { genReference, isISODate, maskIdNumber, nightsBetween, todayISO } from "@/lib/utils";

const digits = (s: string) => s.replace(/\D/g, "");
const fmt = (n: number) => `PKR ${n.toLocaleString("en-PK")}`;

export type PassInput = {
  eventSlug: string;
  name: string;
  age: number;
  gender?: string;
  phone: string;
  whatsapp: string;
  email: string;
  guestsCount: number;
  /** Optional stay request: just dates, the team quotes on the call. */
  stay?: { from: string; to: string; city?: string } | null;
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

  const [event] = await db.select().from(events).where(eq(events.slug, input.eventSlug)).limit(1);
  if (!event || event.status !== "PUBLISHED")
    return { ok: false as const, error: "This workshop is not open for booking right now." };
  const visitDate = event.startDate && event.startDate >= todayISO() ? event.startDate : todayISO();
  if (event.startDate && event.startDate < todayISO() && (event.endDate ?? event.startDate) < todayISO())
    return { ok: false as const, error: "This workshop has already happened." };

  const taken = await db
    .select({ count: sql<number>`count(*)` })
    .from(eventRegistrations)
    .where(and(eq(eventRegistrations.eventId, event.id), ne(eventRegistrations.status, "CANCELLED")));
  if (Number(taken[0]?.count ?? 0) + guests > event.capacity)
    return { ok: false as const, error: "Sorry, not enough seats left. Message us on WhatsApp for the next one." };

  let stay: { from: string; to: string; city: string | null } | null = null;
  if (input.stay) {
    const { from, to } = input.stay;
    if (!isISODate(from) || !isISODate(to) || from < todayISO() || to <= from)
      return { ok: false as const, error: "Please choose your stay dates (arrival before departure)." };
    stay = { from, to, city: input.stay.city?.trim() || null };
  }

  const amount = event.ticketPkr * guests;
  // Seats count against the event's capacity and show in reports.
  const [reg] = await db
    .insert(eventRegistrations)
    .values({ eventId: event.id, name, email, phone: whatsapp, pricePkr: event.ticketPkr, amountDuePkr: amount, status: "PENDING_PAYMENT" })
    .returning({ id: eventRegistrations.id });

  const reference = genReference("CP");
  const [pass] = await db
    .insert(passes)
    .values({
      reference,
      kind: "EVENT",
      eventId: event.id,
      registrationId: reg.id,
      visitDate,
      name,
      age,
      gender: input.gender === "Female" || input.gender === "Male" ? input.gender : null,
      phone,
      whatsapp,
      email,
      city: stay?.city ?? null,
      guestsCount: guests,
      amountPkr: amount,
      wantsStay: Boolean(stay),
      stayFrom: stay?.from ?? null,
      stayTo: stay?.to ?? null,
      utm: input.utm && Object.keys(input.utm).length ? input.utm : null,
    })
    .returning();

  const what = `${event.title} pass`;
  const stayLine = stay ? `${stay.from} to ${stay.to} (${nightsBetween(stay.from, stay.to)} nights)${stay.city ? `, coming from ${stay.city}` : ""}` : "";
  const portal = `${siteUrl()}/pass/${reference}?email=${encodeURIComponent(email)}`;
  const waNumber = digits(whatsapp).replace(/^0/, "92");

  // CRM: contact + opportunity in GoHighLevel (no-op until keys are set).
  await queueLeadSync({
    entityType: "pass",
    entityId: pass.id,
    name,
    email,
    phone: whatsapp,
    tags: ["content-colony", "workshop-pass", ...(stay ? ["stay-request", "out-of-city"] : [])],
    source: `Content Colony — ${what}`,
    notes: `Ref ${reference} · ${guests} guest(s)${stay ? ` · stay ${stayLine}` : ""}`,
    utm: input.utm ?? null,
    opportunity: { name: `${name} — ${what}${stay ? " + stay request" : ""}`, monetaryValue: amount },
  });

  // Team alert
  await recordNotification({
    channel: "EMAIL",
    to: await teamInbox(),
    copyTeam: false,
    subject: `New booking: ${what} — ${name}${stay ? " (+ stay request)" : ""}`,
    body: [
      `New ${what} request. Please call / WhatsApp to confirm and take payment.`,
      ``,
      `Reference: ${reference}`,
      `Name: ${name}`,
      `Age: ${age}${input.gender ? ` · ${input.gender}` : ""}`,
      `Phone: ${phone}`,
      `WhatsApp: ${whatsapp}  (https://wa.me/${waNumber})`,
      `Email: ${email}`,
      `Guests: ${guests}`,
      `Amount: ${amount > 0 ? fmt(amount) : "free"}`,
      stay ? `Stay request: ${stayLine} — share the price on the call.` : null,
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
      `Shukriya — we received your ${what} request (${guests} ${guests === 1 ? "guest" : "guests"}).`,
      `Our team will call or WhatsApp you shortly to confirm your seat and payment.`,
      stay ? `\nYour stay request (${stayLine}) is noted too. We'll share the details on the call.` : null,
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
    what,
    amount,
    stay: Boolean(stay),
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
