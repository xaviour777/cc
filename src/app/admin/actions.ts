"use server";

import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  agreements,
  articleTranslations,
  articles,
  bookings,
  checkInOuts,
  eventProposals,
  eventRegistrations,
  events,
  ghlSyncs,
  inventoryBlocks,
  kycDocuments,
  payments,
  properties,
  ratePlans,
  refunds,
  socialPosts,
  studioReservations,
  users,
} from "@/db/schema";
import {
  createSession,
  destroySession,
  getSessionUser,
  hashPassword,
  logAction,
  loginAllowed,
  totpGenerateSecret,
  totpVerify,
  verifyPassword,
} from "@/lib/auth";
import { createBooking, getPlansFor, quoteStay, setSetting } from "@/lib/stays";
import { queueLeadSync, recordNotification, retryPendingSyncs } from "@/lib/ghl";
import { genReference, isISODate, slugify, todayISO, nightsBetween } from "@/lib/utils";

type R = { ok: boolean; error?: string };
const ok: R = { ok: true };
const fail = (error: string): R => ({ ok: false, error });

async function adminUser() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

// ---------- Auth ----------
export async function adminLogin(input: {
  email: string;
  password: string;
  mfaCode?: string;
}): Promise<R & { requiresMfa?: boolean }> {
  if (!loginAllowed(input.email.toLowerCase())) return fail("Too many attempts — wait 10 minutes.");
  const rows = await db.select().from(users).where(eq(users.email, input.email.toLowerCase().trim())).limit(1);
  const user = rows[0];
  if (!user || user.role !== "ADMIN" || !verifyPassword(input.password, user.passwordHash))
    return fail("Invalid email or password.");
  if (user.mfaEnabled && user.mfaSecret) {
    if (!input.mfaCode) return { ok: false, requiresMfa: true, error: "Enter the 6-digit code from your authenticator." };
    if (!totpVerify(user.mfaSecret, input.mfaCode)) return fail("Wrong authenticator code.");
  }
  await createSession(user.id);
  await logAction(user.id, "login", "session");
  return ok;
}

export async function adminLogout(): Promise<R> {
  const user = await getSessionUser();
  if (user) await logAction(user.id, "logout", "session");
  await destroySession();
  return ok;
}

export async function mfaStart(): Promise<{ ok: boolean; secret?: string; error?: string }> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  const secret = totpGenerateSecret();
  await db.update(users).set({ mfaSecret: secret, mfaEnabled: false }).where(eq(users.id, user.id));
  return { ok: true, secret };
}

export async function mfaEnable(code: string): Promise<R> {
  const user = await adminUser();
  if (!user || !user.mfaSecret) return fail("Start setup first.");
  if (!totpVerify(user.mfaSecret, code)) return fail("Code doesn't match — try again.");
  await db.update(users).set({ mfaEnabled: true }).where(eq(users.id, user.id));
  await logAction(user.id, "mfa-enable", "user", user.id);
  return ok;
}

export async function changePassword(current: string, next: string): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  if (!verifyPassword(current, user.passwordHash)) return fail("Current password is wrong.");
  if (next.length < 10) return fail("Use at least 10 characters.");
  await db.update(users).set({ passwordHash: hashPassword(next) }).where(eq(users.id, user.id));
  await logAction(user.id, "password-change", "user", user.id);
  return ok;
}

// ---------- Bookings ----------
export async function confirmPaymentAction(paymentId: number): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  const [p] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  if (!p) return fail("Payment not found");
  await db.update(payments).set({ status: "CONFIRMED", confirmedBy: user.id, confirmedAt: new Date() }).where(eq(payments.id, paymentId));
  if (p.bookingId) {
    await db.update(bookings).set({ status: "CONFIRMED", updatedAt: new Date() })
      .where(and(eq(bookings.id, p.bookingId), eq(bookings.status, "PENDING_PAYMENT")));
    const [b] = await db.select().from(bookings).where(eq(bookings.id, p.bookingId));
    if (b) {
      await recordNotification({
        channel: "EMAIL",
        to: b.guestEmail,
        subject: `Payment received — ${b.reference} confirmed`,
        body: `Your payment of PKR ${p.amountPkr.toLocaleString("en-PK")} is confirmed. Your stay at Content Colony (${b.checkIn} → ${b.checkOut}) is booked. See you soon!`,
        entityType: "booking",
        entityId: b.id,
      });
    }
  }
  if (p.eventRegistrationId) {
    await db.update(eventRegistrations).set({ status: "CONFIRMED" }).where(eq(eventRegistrations.id, p.eventRegistrationId));
  }
  await logAction(user.id, "payment-confirm", "payment", paymentId, { bookingId: p.bookingId });
  return ok;
}

export async function addPayment(bookingId: number, amountPkr: number, method: "BANK_TRANSFER" | "RAAST" | "CARD_LINK" | "CASH_ON_ARRIVAL", note: string): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  if (amountPkr <= 0) return fail("Amount must be positive");
  await db.insert(payments).values({ bookingId, kind: "STAY", method, amountPkr, status: "CONFIRMED", confirmedBy: user.id, confirmedAt: new Date(), note });
  await logAction(user.id, "payment-add", "booking", bookingId, { amountPkr, method });
  return ok;
}

export async function refundPayment(paymentId: number, amountPkr: number, reason: string): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  if (!reason.trim()) return fail("A reason is required");
  const [p] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  if (!p) return fail("Payment not found");
  if (amountPkr <= 0 || amountPkr > p.amountPkr) return fail("Invalid refund amount");
  await db.insert(refunds).values({ paymentId, amountPkr, reason, status: "PROCESSED", processedAt: new Date() });
  await db.update(payments).set({ status: "REFUNDED" }).where(eq(payments.id, paymentId));
  await logAction(user.id, "refund", "payment", paymentId, { amountPkr, reason });
  return ok;
}

export async function cancelBooking(bookingId: number, reason: string): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  if (!reason.trim()) return fail("Record a reason for the cancellation");
  await db.update(bookings).set({ status: "CANCELLED", notes: reason, updatedAt: new Date() }).where(eq(bookings.id, bookingId));
  await logAction(user.id, "booking-cancel", "booking", bookingId, { reason });
  return ok;
}

export async function checkInGuest(bookingId: number, notes: string): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!b) return fail("Booking not found");
  if (b.status !== "CONFIRMED") return fail("Only confirmed bookings can check in — confirm payment first.");
  await db.update(bookings).set({ status: "CHECKED_IN", updatedAt: new Date() }).where(eq(bookings.id, bookingId));
  await db.insert(checkInOuts).values({ bookingId, type: "CHECK_IN", notes: notes || null, byUserId: user.id });
  await logAction(user.id, "check-in", "booking", bookingId);
  return ok;
}

export async function checkOutGuest(bookingId: number, notes: string): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!b) return fail("Booking not found");
  if (b.status !== "CHECKED_IN") return fail("Only checked-in guests can check out.");
  await db.update(bookings).set({ status: "COMPLETED", updatedAt: new Date() }).where(eq(bookings.id, bookingId));
  await db.insert(checkInOuts).values({ bookingId, type: "CHECK_OUT", notes: notes || null, byUserId: user.id });
  await logAction(user.id, "check-out", "booking", bookingId);
  return ok;
}

export async function assignBed(bookingId: number, bedId: number | null, roomId: number | null): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  // Re-validate overlap for the new unit on this booking's dates
  const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!b) return fail("Booking not found");
  if (bedId) {
    const clash = await db.select({ id: bookings.id }).from(bookings)
      .where(and(eq(bookings.bedId, bedId), ne(bookings.id, bookingId), ne(bookings.status, "CANCELLED"), ne(bookings.status, "COMPLETED"), sql`${bookings.checkIn} < ${b.checkOut}`, sql`${bookings.checkOut} > ${b.checkIn}`)).limit(1);
    const blockClash = await db.select({ id: inventoryBlocks.id }).from(inventoryBlocks)
      .where(and(eq(inventoryBlocks.bedId, bedId), sql`${inventoryBlocks.startDate} < ${b.checkOut}`, sql`${inventoryBlocks.endDate} > ${b.checkIn}`)).limit(1);
    if (clash.length || blockClash.length) return fail("That bed is occupied or blocked on these dates.");
  }
  await db.update(bookings).set({ bedId, roomId, updatedAt: new Date() }).where(eq(bookings.id, bookingId));
  await logAction(user.id, "assign-unit", "booking", bookingId, { bedId, roomId });
  return ok;
}

export async function setComplianceFlag(bookingId: number, field: "hotelEye" | "tempResident", value: boolean): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  await db.update(bookings)
    .set(field === "hotelEye" ? { complianceHotelEye: value } : { complianceTempResident: value })
    .where(eq(bookings.id, bookingId));
  await logAction(user.id, "compliance-flag", "booking", bookingId, { field, value });
  return ok;
}

export async function adminCreateBooking(input: {
  accommodationKey: "SHARED_BUNK" | "PRIVATE_ROOM";
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestsCount: number;
  paymentMethod: "BANK_TRANSFER" | "RAAST" | "CARD_LINK" | "CASH_ON_ARRIVAL";
  overrideMinStay: boolean;
  overrideReason: string;
}): Promise<R & { reference?: string }> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  const result = await createBooking({
    ...input,
    adminOverride: input.overrideMinStay ? { reason: input.overrideReason, byUserId: user.id } : undefined,
  });
  if (!result.ok) return fail(result.error);
  await queueLeadSync({
    entityType: "booking",
    entityId: result.bookingId,
    name: input.guestName,
    email: input.guestEmail,
    phone: input.guestPhone,
    tags: ["content-colony", "booking-enquiry", "admin-created"],
    source: "Content Colony — Admin",
    notes: `Ref ${result.reference} · admin-created`,
  });
  await logAction(user.id, "booking-create", "booking", result.bookingId, { reference: result.reference });
  return { ok: true, reference: result.reference };
}

// ---------- Custom price (offer agreed on WhatsApp) ----------
export async function setCustomPrice(bookingId: number, amountPkr: number, label: string): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  if (!Number.isFinite(amountPkr) || amountPkr <= 0) return fail("Enter the agreed price in PKR");
  const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!b) return fail("Booking not found");
  const amount = Math.round(amountPkr);
  const line = { label: label.trim() || "Custom offer", qty: 1, unitPricePkr: amount, subtotalPkr: amount };
  await db
    .update(bookings)
    .set({ totalPkr: amount, priceBreakdown: [line], pricePending: false, updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));
  const [pending] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.bookingId, bookingId), eq(payments.status, "PENDING")))
    .limit(1);
  if (pending) await db.update(payments).set({ amountPkr: amount }).where(eq(payments.id, pending.id));
  else if (b.status === "PENDING_PAYMENT")
    await db.insert(payments).values({ bookingId, kind: "STAY", method: "BANK_TRANSFER", amountPkr: amount, status: "PENDING" });
  await recordNotification({
    channel: "EMAIL",
    to: b.guestEmail,
    subject: `Your price for ${b.reference}`,
    body: `Assalam-o-alaikum ${b.guestName}! Your stay ${b.checkIn} → ${b.checkOut} is PKR ${amount.toLocaleString("en-PK")}. Open your booking page to verify your ID and pay.`,
    entityType: "booking",
    entityId: b.id,
  });
  await logAction(user.id, "booking-custom-price", "booking", bookingId, { amountPkr: amount, label: line.label });
  return ok;
}

// ---------- Inventory blocks ----------
export async function addInventoryBlock(unit: { bedId?: number; roomId?: number }, startDate: string, endDate: string, reason: string): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  if (!unit.bedId && !unit.roomId) return fail("Choose a room or bed");
  if (!isISODate(startDate) || !isISODate(endDate) || nightsBetween(startDate, endDate) < 1) return fail("Invalid dates");
  if (!reason.trim()) return fail("A reason is required (e.g. maintenance)");
  await db.insert(inventoryBlocks).values({ roomId: unit.roomId ?? null, bedId: unit.bedId ?? null, startDate, endDate, reason: reason.trim(), createdBy: user.id });
  await logAction(user.id, "inventory-block", "block", undefined, { ...unit, startDate, endDate });
  return ok;
}

export async function removeInventoryBlock(id: number): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  await db.delete(inventoryBlocks).where(eq(inventoryBlocks.id, id));
  await logAction(user.id, "inventory-unblock", "block", id);
  return ok;
}

// ---------- KYC ----------
export async function reviewKyc(id: number, status: "APPROVED" | "REJECTED", note: string): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  await db.update(kycDocuments).set({ status, reviewNote: note || null, reviewedBy: user.id, reviewedAt: new Date() }).where(eq(kycDocuments.id, id));
  await logAction(user.id, `kyc-${status.toLowerCase()}`, "kyc", id);
  return ok;
}

// ---------- Events ----------
export async function upsertEvent(fd: FormData): Promise<R & { id?: number }> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  const id = Number(fd.get("id") || 0);
  const title = String(fd.get("title") ?? "").trim();
  if (title.length < 4) return fail("Title is required");
  const slug = String(fd.get("slug") ?? "").trim() || slugify(title);
  const startDate = String(fd.get("startDate") ?? "");
  const endDate = String(fd.get("endDate") ?? "");
  const outcomesRaw = String(fd.get("outcomes") ?? "");
  const scheduleRaw = String(fd.get("schedule") ?? "");
  let outcomes: string[] = [];
  try {
    outcomes = JSON.parse(outcomesRaw || "[]");
  } catch {
    outcomes = outcomesRaw.split("\n").map((s) => s.trim()).filter(Boolean);
  }
  let schedule: { day: string; title: string; detail: string }[] = [];
  try {
    schedule = JSON.parse(scheduleRaw || "[]");
  } catch {
    schedule = [];
  }
  const values = {
    title,
    slug,
    kind: (fd.get("kind") === "COMMUNITY" ? "COMMUNITY" : fd.get("kind") === "MEETUP" ? "MEETUP" : "WORKSHOP") as "WORKSHOP" | "MEETUP" | "COMMUNITY",
    category: String(fd.get("category") ?? "General"),
    hostName: String(fd.get("hostName") ?? "") || null,
    hostRole: String(fd.get("hostRole") ?? "") || null,
    hostImage: String(fd.get("hostImage") ?? "") || null,
    image: String(fd.get("image") ?? "") || null,
    excerpt: String(fd.get("excerpt") ?? ""),
    description: String(fd.get("description") ?? ""),
    outcomes,
    schedule,
    startDate: isISODate(startDate) ? startDate : null,
    endDate: isISODate(endDate) ? endDate : null,
    timeLabel: String(fd.get("timeLabel") ?? "") || null,
    durationLabel: String(fd.get("durationLabel") ?? "") || null,
    venue: String(fd.get("venue") ?? "Content Colony, Johar Town"),
    capacity: Math.max(1, Number(fd.get("capacity") || 30)),
    ticketPkr: Math.max(0, Number(fd.get("ticketPkr") || 0)),
    residentDiscountPct: fd.get("residentDiscountPct") ? Number(fd.get("residentDiscountPct")) : null,
    status: (["DRAFT", "PUBLISHED", "FULL", "COMPLETED", "CANCELLED"].includes(String(fd.get("status"))) ? String(fd.get("status")) : "DRAFT") as "DRAFT",
    featured: fd.get("featured") === "on",
    complianceNote: String(fd.get("complianceNote") ?? "") || null,
    updatedAt: new Date(),
  };
  if (id) {
    await db.update(events).set(values).where(eq(events.id, id));
    await logAction(user.id, "event-update", "event", id);
    return { ok: true, id };
  }
  const [row] = await db.insert(events).values(values).returning({ id: events.id });
  await logAction(user.id, "event-create", "event", row.id);
  return { ok: true, id: row.id };
}

export async function setEventStatus(id: number, status: string): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  if (!["DRAFT", "PUBLISHED", "FULL", "COMPLETED", "CANCELLED"].includes(status)) return fail("Bad status");
  await db.update(events).set({ status: status as never, updatedAt: new Date() }).where(eq(events.id, id));
  await logAction(user.id, "event-status", "event", id, { status });
  return ok;
}

export async function deleteEvent(id: number): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  await db.delete(events).where(eq(events.id, id));
  await logAction(user.id, "event-delete", "event", id);
  return ok;
}

export async function setProposalStatus(id: number, status: "NEW" | "REVIEWED" | "APPROVED" | "REJECTED", note: string): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  await db.update(eventProposals).set({ status, adminNote: note || null }).where(eq(eventProposals.id, id));
  await logAction(user.id, `proposal-${status.toLowerCase()}`, "proposal", id);
  return ok;
}

export async function approveProposalToEvent(id: number): Promise<R & { eventId?: number }> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  const [p] = await db.select().from(eventProposals).where(eq(eventProposals.id, id)).limit(1);
  if (!p) return fail("Proposal not found");
  const [row] = await db.insert(events).values({
    slug: `${slugify(p.title)}-${genReference("EV").slice(-5).toLowerCase()}`,
    title: p.title,
    kind: "WORKSHOP",
    category: p.category,
    hostName: p.organizerName,
    hostRole: p.brand ?? "Guest host",
    image: p.coverImage ?? null,
    excerpt: p.description.slice(0, 160),
    description: p.description,
    startDate: p.preferredDate,
    status: "DRAFT",
    ticketPkr: 0,
  }).returning({ id: events.id });
  await db.update(eventProposals).set({ status: "APPROVED", adminNote: `Converted to event draft #${row.id}` }).where(eq(eventProposals.id, id));
  await logAction(user.id, "proposal-convert", "proposal", id, { eventId: row.id });
  return { ok: true, eventId: row.id };
}

// ---------- Articles ----------
export async function upsertArticle(fd: FormData): Promise<R & { id?: number }> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  const id = Number(fd.get("id") || 0);
  const status = String(fd.get("status") ?? "DRAFT");
  const values = {
    categoryId: Number(fd.get("categoryId") || 0) || null,
    coverImage: String(fd.get("coverImage") ?? "") || null,
    authorName: String(fd.get("authorName") ?? "Content Colony"),
    authorRole: String(fd.get("authorRole") ?? "") || null,
    status: (["DRAFT", "PUBLISHED", "SCHEDULED"].includes(status) ? status : "DRAFT") as "DRAFT",
    publishedAt: fd.get("publishedAt") ? new Date(String(fd.get("publishedAt"))) : null,
    featured: fd.get("featured") === "on",
    seoTitle: String(fd.get("seoTitle") ?? "") || null,
    seoDescription: String(fd.get("seoDescription") ?? "") || null,
    ogImage: String(fd.get("ogImage") ?? "") || null,
    readingMinutes: Math.max(1, Number(fd.get("readingMinutes") || 4)),
    relatedEventSlug: String(fd.get("relatedEventSlug") ?? "") || null,
    updatedAt: new Date(),
  };
  let articleId = id;
  if (id) {
    await db.update(articles).set(values).where(eq(articles.id, id));
  } else {
    const [row] = await db.insert(articles).values(values).returning({ id: articles.id });
    articleId = row.id;
  }
  // translations passed as JSON
  const trs = JSON.parse(String(fd.get("translations") ?? "[]")) as { lang: string; slug: string; title: string; excerpt: string; content: string }[];
  for (const t of trs) {
    if (!t.title.trim()) continue;
    const slug = t.slug.trim() || slugify(t.title);
    const existing = await db.select({ id: articleTranslations.id }).from(articleTranslations)
      .where(and(eq(articleTranslations.articleId, articleId), eq(articleTranslations.lang, t.lang))).limit(1);
    if (existing.length) {
      await db.update(articleTranslations).set({ slug, title: t.title, excerpt: t.excerpt, content: t.content }).where(eq(articleTranslations.id, existing[0].id));
    } else {
      await db.insert(articleTranslations).values({ articleId, lang: t.lang, slug, title: t.title, excerpt: t.excerpt, content: t.content });
    }
  }
  await logAction(user.id, id ? "article-update" : "article-create", "article", articleId);
  return { ok: true, id: articleId };
}

export async function setArticleStatus(id: number, status: "DRAFT" | "PUBLISHED" | "SCHEDULED"): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  await db.update(articles).set({ status, publishedAt: status === "PUBLISHED" ? new Date() : null, updatedAt: new Date() }).where(eq(articles.id, id));
  await logAction(user.id, "article-status", "article", id, { status });
  return ok;
}

export async function deleteArticle(id: number): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  await db.delete(articles).where(eq(articles.id, id));
  await logAction(user.id, "article-delete", "article", id);
  return ok;
}

// ---------- Social posts ----------
export async function upsertSocialPost(fd: FormData): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  const id = Number(fd.get("id") || 0);
  const values = {
    platform: (["INSTAGRAM", "TIKTOK", "YOUTUBE", "FACEBOOK"].includes(String(fd.get("platform"))) ? String(fd.get("platform")) : "INSTAGRAM") as "INSTAGRAM",
    url: String(fd.get("url") ?? ""),
    thumbnail: String(fd.get("thumbnail") ?? ""),
    creatorName: String(fd.get("creatorName") ?? "Resident"),
    creatorHandle: String(fd.get("creatorHandle") ?? "") || null,
    caption: String(fd.get("caption") ?? ""),
    category: String(fd.get("category") ?? "") || null,
    featured: fd.get("featured") === "on",
    active: fd.get("active") === "on" || !fd.has("active"),
    sortOrder: Number(fd.get("sortOrder") || 0),
  };
  if (!values.thumbnail) return fail("A thumbnail URL is required");
  if (id) {
    await db.update(socialPosts).set(values).where(eq(socialPosts.id, id));
    await logAction(user.id, "social-update", "social", id);
  } else {
    const [row] = await db.insert(socialPosts).values(values).returning({ id: socialPosts.id });
    await logAction(user.id, "social-create", "social", row.id);
  }
  return ok;
}

export async function moveSocialPost(id: number, dir: -1 | 1): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, id)).limit(1);
  if (!post) return fail("Not found");
  await db.update(socialPosts).set({ sortOrder: post.sortOrder + dir }).where(eq(socialPosts.id, id));
  return ok;
}

export async function deleteSocialPost(id: number): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  await db.delete(socialPosts).where(eq(socialPosts.id, id));
  await logAction(user.id, "social-delete", "social", id);
  return ok;
}

// ---------- Settings ----------
export async function updateSettings(entries: Record<string, unknown>): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  for (const [key, value] of Object.entries(entries)) await setSetting(key, value);
  await logAction(user.id, "settings-update", "settings", undefined, { keys: Object.keys(entries) });
  return ok;
}

export async function updateProperty(fd: FormData): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  const id = Number(fd.get("id"));
  await db
    .update(properties)
    .set({
      address: String(fd.get("address") ?? "") || null,
      addressApproved: fd.get("addressApproved") === "on",
      mapEmbedUrl: String(fd.get("mapEmbedUrl") ?? "") || null,
      mapDirectionsUrl: String(fd.get("mapDirectionsUrl") ?? "") || null,
    })
    .where(eq(properties.id, id));
  await logAction(user.id, "property-update", "property", id);
  return ok;
}

export async function updateRatePlan(id: number, pricePkr: number, minBookingNights: number, active: boolean): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  if (pricePkr < 0) return fail("Price can't be negative");
  await db.update(ratePlans).set({ pricePkr, minBookingNights, active }).where(eq(ratePlans.id, id));
  await logAction(user.id, "rate-update", "rate", id, { pricePkr });
  return ok;
}

export async function upsertAgreement(fd: FormData): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  const body = String(fd.get("body") ?? "");
  if (body.trim().length < 40) return fail("Agreement text is too short");
  const [latest] = await db.select().from(agreements).orderBy(desc(agreements.version)).limit(1);
  await db.update(agreements).set({ active: false }).where(eq(agreements.active, true));
  await db.insert(agreements).values({ version: (latest?.version ?? 0) + 1, title: "Content Colony Resident Stay Agreement", body, active: true });
  await logAction(user.id, "agreement-version", "agreement");
  return ok;
}

// ---------- Studio ----------
export async function cancelStudioReservation(id: number): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  await db.update(studioReservations).set({ status: "CANCELLED" }).where(eq(studioReservations.id, id));
  await logAction(user.id, "studio-cancel", "studio", id);
  return ok;
}

// ---------- GHL ----------
export async function retryGhlSyncs(): Promise<R & { sent?: number }> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  const sent = await retryPendingSyncs();
  await logAction(user.id, "ghl-retry", "ghl", undefined, { sent });
  return { ok: true, sent };
}

export async function markGhlSkipped(id: number): Promise<R> {
  const user = await adminUser();
  if (!user) return fail("Unauthorized");
  await db.update(ghlSyncs).set({ status: "SKIPPED", updatedAt: new Date() }).where(eq(ghlSyncs.id, id));
  return ok;
}
