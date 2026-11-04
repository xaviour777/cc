import { eq } from "drizzle-orm";
import { db } from "@/db";
import { coupons, type Coupon } from "@/db/schema";
import { todayISO } from "@/lib/utils";

export type CouponCheck =
  | { ok: true; coupon: Coupon; discountPkr: number; label: string }
  | { ok: false; error: string };

export function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

/** Validates a coupon for a subtotal and works out the discount (never more than the subtotal). */
export async function evaluateCoupon(
  rawCode: string,
  subtotalPkr: number,
  scope: "STAY" | "EVENT",
  nights?: number
): Promise<CouponCheck> {
  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, error: "Enter a coupon code." };
  const [c] = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
  if (!c || !c.active) return { ok: false, error: "This coupon code is not valid." };
  if (c.appliesTo !== "ALL" && c.appliesTo !== scope)
    return { ok: false, error: scope === "STAY" ? "This coupon is for events, not stays." : "This coupon is for stays, not events." };
  if (c.expiresOn && c.expiresOn < todayISO()) return { ok: false, error: "This coupon has expired." };
  if (c.maxUses != null && c.usedCount >= c.maxUses) return { ok: false, error: "This coupon has been fully used." };
  if (scope === "STAY" && c.minNights && (nights ?? 0) < c.minNights)
    return { ok: false, error: `This coupon needs a stay of at least ${c.minNights} nights.` };
  const raw = c.kind === "FIXED" ? c.value : Math.round((subtotalPkr * c.value) / 100);
  const discountPkr = Math.max(0, Math.min(subtotalPkr, raw));
  const label = c.kind === "FIXED" ? `Coupon ${c.code}` : `Coupon ${c.code} (${c.value}% off)`;
  return { ok: true, coupon: c, discountPkr, label };
}
