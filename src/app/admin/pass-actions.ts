"use server";

import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { eventRegistrations, passes, payments } from "@/db/schema";
import { getSessionUser, logAction } from "@/lib/auth";
import { recordNotification } from "@/lib/ghl";
import { saveKycFile } from "@/lib/kyc-storage";
import { maskIdNumber } from "@/lib/utils";

type R = { ok: boolean; error?: string };
type Method = "BANK_TRANSFER" | "RAAST" | "CARD_LINK" | "CASH_ON_ARRIVAL";

async function adminUser() {
  const user = await getSessionUser();
  return user && user.role === "ADMIN" ? user : null;
}

async function getPass(id: number) {
  const [p] = await db.select().from(passes).where(eq(passes.id, id)).limit(1);
  return p ?? null;
}

/** Team called the guest and took payment: mark the pass confirmed. */
export async function confirmPass(id: number, paidPkr: number, method: Method): Promise<R> {
  const user = await adminUser();
  if (!user) return { ok: false, error: "Unauthorized" };
  const p = await getPass(id);
  if (!p) return { ok: false, error: "Pass not found" };
  if (p.status !== "PENDING") return { ok: false, error: "Only pending passes can be confirmed." };
  const paid = Math.max(0, Math.round(paidPkr || 0));
  await db
    .update(passes)
    .set({
      status: "CONFIRMED",
      paidPkr: paid,
      amountPkr: p.amountPkr || paid,
      paymentMethod: paid > 0 ? method : null,
      confirmedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(passes.id, id));
  if (p.registrationId)
    await db.update(eventRegistrations).set({ status: "CONFIRMED" }).where(eq(eventRegistrations.id, p.registrationId));
  if (paid > 0)
    await db.insert(payments).values({
      eventRegistrationId: p.registrationId,
      kind: p.kind === "EVENT" ? "TICKET" : "PASS",
      method,
      amountPkr: paid,
      status: "CONFIRMED",
      confirmedBy: user.id,
      confirmedAt: new Date(),
      note: `Pass ${p.reference}`,
    });
  await recordNotification({
    channel: "EMAIL",
    to: p.email,
    copyTeam: false,
    subject: `Confirmed: your Content Colony pass ${p.reference}`,
    body: `Assalam-o-alaikum ${p.name}! Your pass for ${p.visitDate} is confirmed${paid > 0 ? ` (PKR ${paid.toLocaleString("en-PK")} received)` : ""}.${
      p.kycUploadedAt ? "" : " Please add your ID before you come, using the link in your first email."
    } See you soon — your people are here.`,
    entityType: "pass",
    entityId: p.id,
  });
  await logAction(user.id, "pass-confirm", "pass", id, { paid, method });
  return { ok: true };
}

export async function checkInPass(id: number): Promise<R> {
  const user = await adminUser();
  if (!user) return { ok: false, error: "Unauthorized" };
  const p = await getPass(id);
  if (!p) return { ok: false, error: "Pass not found" };
  if (p.status !== "CONFIRMED") return { ok: false, error: "Confirm the pass (payment) before check-in." };
  if (!p.kycUploadedAt) return { ok: false, error: "No ID on file yet — add the guest's ID first (Add ID button)." };
  await db.update(passes).set({ status: "CHECKED_IN", checkedInAt: new Date(), updatedAt: new Date() }).where(eq(passes.id, id));
  await logAction(user.id, "pass-check-in", "pass", id);
  return { ok: true };
}

export async function cancelPass(id: number, reason: string): Promise<R> {
  const user = await adminUser();
  if (!user) return { ok: false, error: "Unauthorized" };
  const p = await getPass(id);
  if (!p) return { ok: false, error: "Pass not found" };
  await db
    .update(passes)
    .set({ status: "CANCELLED", notes: [p.notes, `Cancelled: ${reason || "no reason"}`].filter(Boolean).join("\n"), updatedAt: new Date() })
    .where(eq(passes.id, id));
  if (p.registrationId)
    await db.update(eventRegistrations).set({ status: "CANCELLED" }).where(eq(eventRegistrations.id, p.registrationId));
  await logAction(user.id, "pass-cancel", "pass", id, { reason });
  return { ok: true };
}

export async function setPassNote(id: number, note: string): Promise<R> {
  const user = await adminUser();
  if (!user) return { ok: false, error: "Unauthorized" };
  await db.update(passes).set({ notes: note.trim() || null, updatedAt: new Date() }).where(eq(passes.id, id));
  return { ok: true };
}

/** Front desk: add the guest's ID when they didn't upload it themselves. */
export async function adminUploadPassKyc(fd: FormData): Promise<R> {
  const user = await adminUser();
  if (!user) return { ok: false, error: "Unauthorized" };
  const p = await getPass(Number(fd.get("id")));
  if (!p) return { ok: false, error: "Pass not found" };
  const file = fd.get("file") as File | null;
  const docType = String(fd.get("docType") ?? "CNIC");
  if (!file || file.size === 0) return { ok: false, error: "Attach a photo of the ID." };
  if (file.size > 4 * 1024 * 1024) return { ok: false, error: "File is too large (max 4 MB)." };
  if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type))
    return { ok: false, error: "Upload a JPG, PNG, WEBP or PDF." };
  const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1];
  const name = `pass-${p.id}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
  const filePath = await saveKycFile(name, file.type, Buffer.from(await file.arrayBuffer()));
  await db
    .update(passes)
    .set({
      kycDocType: docType,
      kycIdLast4: maskIdNumber(String(fd.get("idNumber") ?? "")) || null,
      kycFilePath: filePath,
      kycFileName: file.name,
      kycMime: file.type,
      kycUploadedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(passes.id, p.id));
  await logAction(user.id, "pass-kyc-add", "pass", p.id);
  return { ok: true };
}
