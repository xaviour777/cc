import { and, eq, ne, notInArray, gte, lte, sql, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  accommodationTypes,
  ratePlans,
  rooms,
  beds,
  bookings,
  inventoryBlocks,
  payments,
  siteSettings,
  type RatePlan,
} from "@/db/schema";
import { addDaysISO, genReference, isISODate, nightsBetween, todayISO } from "@/lib/utils";

export type QuoteLine = {
  label: string;
  qty: number;
  unitPricePkr: number;
  subtotalPkr: number;
};
export type Quote =
  | { ok: true; nights: number; lines: QuoteLine[]; totalPkr: number }
  | { ok: false; nights: number; error: string };

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const rows = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, key))
    .limit(1);
  return rows[0] ? ((rows[0].value as T) ?? fallback) : fallback;
}

export async function setSetting(key: string, value: unknown) {
  await db
    .insert(siteSettings)
    .values({ key, value: value as never })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value: value as never, updatedAt: new Date() },
    });
}

/** "Price on request" mode: prices stay hidden and stays are pre-booking requests. */
export async function getHidePrices(): Promise<boolean> {
  return String(await getSetting<string>("hidePrices", "no")) === "yes";
}

export async function getWhatsappNumber(): Promise<string> {
  return String(await getSetting<string>("whatsappNumber", "")).replace(/\D/g, "");
}

export async function getMinStayNights(): Promise<number> {
  return getSetting<number>("minStayNights", 3);
}

export async function getPlansFor(typeId: number): Promise<RatePlan[]> {
  const rows = await db
    .select()
    .from(ratePlans)
    .where(and(eq(ratePlans.accommodationTypeId, typeId), eq(ratePlans.active, true)));
  return rows.sort((a, b) => b.unitNights - a.unitNights);
}

/**
 * Package-first pricing: longer-stay bundles (30-night, 7-night) are consumed
 * before the nightly rate is applied to the remainder. Prices come from
 * rate_plans, so everything is admin-configurable.
 */
export function quoteStay(
  plans: RatePlan[],
  nights: number,
  minStay: number
): Quote {
  if (nights < minStay) {
    return {
      ok: false,
      nights,
      error:
        "Good things take time. Stay at least 3 nights and feel at home.",
    };
  }
  const sorted = [...plans].sort((a, b) => b.unitNights - a.unitNights);
  const lines: QuoteLine[] = [];
  let remaining = nights;
  let total = 0;
  for (const plan of sorted) {
    if (remaining <= 0) break;
    if (plan.unitNights > remaining) continue;
    if (nights < plan.minBookingNights) continue;
    const qty =
      plan.unitNights === 1 ? remaining : Math.floor(remaining / plan.unitNights);
    if (qty <= 0) continue;
    const subtotal = qty * plan.pricePkr;
    lines.push({
      label:
        plan.unitNights === 1
          ? `${plan.name} · PKR ${plan.pricePkr.toLocaleString("en-PK")} / night`
          : `${plan.name} · ${plan.unitNights}-night package`,
      qty,
      unitPricePkr: plan.pricePkr,
      subtotalPkr: subtotal,
    });
    total += subtotal;
    remaining -= qty * plan.unitNights;
  }
  if (remaining > 0 || lines.length === 0) {
    return { ok: false, nights, error: "No rate plan covers these dates." };
  }
  return { ok: true, nights, lines, totalPkr: total };
}

const HOLDING: Array<(typeof bookings.status.enumValues)[number]> = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "CHECKED_IN",
];

// Queries inside a transaction must use its handle: the embedded database has a
// single connection, so a query on `db` would wait for the transaction forever.
type Conn = Pick<typeof db, "select">;

async function overlappingBookingUnitIds(
  checkIn: string,
  checkOut: string,
  conn: Conn = db
): Promise<{ bedIds: number[]; roomIds: number[] }> {
  const rows = await conn
    .select({ bedId: bookings.bedId, roomId: bookings.roomId })
    .from(bookings)
    .where(
      and(
        inArray(bookings.status, HOLDING),
        sql`${bookings.checkIn} < ${checkOut}`,
        sql`${bookings.checkOut} > ${checkIn}`
      )
    );
  return {
    bedIds: rows.map((r) => r.bedId).filter((x): x is number => x != null),
    roomIds: rows.map((r) => r.roomId).filter((x): x is number => x != null),
  };
}

async function blockedUnitIds(
  checkIn: string,
  checkOut: string,
  conn: Conn = db
): Promise<{ bedIds: number[]; roomIds: number[] }> {
  const rows = await conn
    .select({ bedId: inventoryBlocks.bedId, roomId: inventoryBlocks.roomId })
    .from(inventoryBlocks)
    .where(
      and(
        sql`${inventoryBlocks.startDate} < ${checkOut}`,
        sql`${inventoryBlocks.endDate} > ${checkIn}`
      )
    );
  return {
    bedIds: rows.map((r) => r.bedId).filter((x): x is number => x != null),
    roomIds: rows.map((r) => r.roomId).filter((x): x is number => x != null),
  };
}

export type Availability = {
  typeId: number;
  key: "SHARED_BUNK" | "PRIVATE_ROOM";
  totalUnits: number;
  availableUnits: number;
  unitIds: number[];
};

export async function getAvailability(
  checkIn: string,
  checkOut: string
): Promise<Availability[]> {
  const [overlaps, blocks, allRooms, allBeds, types] = await Promise.all([
    overlappingBookingUnitIds(checkIn, checkOut),
    blockedUnitIds(checkIn, checkOut),
    db.select().from(rooms).where(eq(rooms.active, true)),
    db.select().from(beds).where(eq(beds.active, true)),
    db.select().from(accommodationTypes).where(eq(accommodationTypes.active, true)),
  ]);
  const busyBeds = new Set(overlaps.bedIds.concat(blocks.bedIds));
  const busyRooms = new Set(overlaps.roomIds.concat(blocks.roomIds));

  const sharedRooms = new Set(
    allRooms.filter((r) => r.type === "SHARED_BUNK").map((r) => r.id)
  );
  const sharedBeds = allBeds.filter(
    (b) => sharedRooms.has(b.roomId) && !busyRooms.has(b.roomId) && !busyBeds.has(b.id)
  );
  const privateRooms = allRooms.filter(
    (r) => r.type === "PRIVATE_ROOM" && !busyRooms.has(r.id)
  );
  const sharedType = types.find((t) => t.key === "SHARED_BUNK");
  const privateType = types.find((t) => t.key === "PRIVATE_ROOM");

  const totalSharedBeds = allBeds.filter((b) => sharedRooms.has(b.roomId)).length;
  const totalPrivate = allRooms.filter((r) => r.type === "PRIVATE_ROOM").length;

  const out: Availability[] = [];
  if (sharedType)
    out.push({
      typeId: sharedType.id,
      key: "SHARED_BUNK",
      totalUnits: totalSharedBeds,
      availableUnits: sharedBeds.length,
      unitIds: sharedBeds.map((b) => b.id),
    });
  if (privateType)
    out.push({
      typeId: privateType.id,
      key: "PRIVATE_ROOM",
      totalUnits: totalPrivate,
      availableUnits: privateRooms.length,
      unitIds: privateRooms.map((r) => r.id),
    });
  return out;
}

export type CalendarDay = {
  date: string;
  units: Record<"SHARED_BUNK" | "PRIVATE_ROOM", { available: number; total: number }>;
};

/** Night-by-night availability for `days` nights starting at `from`. */
export async function getAvailabilityCalendar(
  from: string,
  days: number
): Promise<CalendarDay[]> {
  const to = addDaysISO(from, days);
  const [allRooms, allBeds, held, blocks] = await Promise.all([
    db.select().from(rooms).where(eq(rooms.active, true)),
    db.select().from(beds).where(eq(beds.active, true)),
    db
      .select({
        bedId: bookings.bedId,
        roomId: bookings.roomId,
        checkIn: bookings.checkIn,
        checkOut: bookings.checkOut,
      })
      .from(bookings)
      .where(
        and(
          inArray(bookings.status, HOLDING),
          sql`${bookings.checkIn} < ${to}`,
          sql`${bookings.checkOut} > ${from}`
        )
      ),
    db
      .select({
        bedId: inventoryBlocks.bedId,
        roomId: inventoryBlocks.roomId,
        checkIn: inventoryBlocks.startDate,
        checkOut: inventoryBlocks.endDate,
      })
      .from(inventoryBlocks)
      .where(
        and(
          sql`${inventoryBlocks.startDate} < ${to}`,
          sql`${inventoryBlocks.endDate} > ${from}`
        )
      ),
  ]);
  const sharedRooms = new Set(
    allRooms.filter((r) => r.type === "SHARED_BUNK").map((r) => r.id)
  );
  const sharedBeds = allBeds.filter((b) => sharedRooms.has(b.roomId));
  const privateRooms = allRooms.filter((r) => r.type === "PRIVATE_ROOM");
  const busy = held.concat(blocks);

  const out: CalendarDay[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDaysISO(from, i);
    const tonight = busy.filter((x) => x.checkIn <= date && x.checkOut > date);
    const busyBeds = new Set(tonight.map((x) => x.bedId));
    const busyRooms = new Set(tonight.map((x) => x.roomId));
    out.push({
      date,
      units: {
        SHARED_BUNK: {
          total: sharedBeds.length,
          available: sharedBeds.filter(
            (b) => !busyBeds.has(b.id) && !busyRooms.has(b.roomId)
          ).length,
        },
        PRIVATE_ROOM: {
          total: privateRooms.length,
          available: privateRooms.filter((r) => !busyRooms.has(r.id)).length,
        },
      },
    });
  }
  return out;
}

export type BookingInput = {
  accommodationKey: "SHARED_BUNK" | "PRIVATE_ROOM";
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestsCount: number;
  paymentMethod: "BANK_TRANSFER" | "RAAST" | "CARD_LINK" | "CASH_ON_ARRIVAL";
  source?: string;
  utm?: Record<string, string>;
  adminOverride?: { reason: string; byUserId: number };
};

export type BookingResult =
  | {
      ok: true;
      bookingId: number;
      reference: string;
      totalPkr: number;
      pricePending: boolean;
      nights: number;
    }
  | { ok: false; error: string; minStay?: boolean };

export async function createBooking(input: BookingInput): Promise<BookingResult> {
  const { checkIn, checkOut } = input;
  if (!isISODate(checkIn) || !isISODate(checkOut))
    return { ok: false, error: "Please choose valid check-in and check-out dates." };
  if (checkIn < todayISO())
    return { ok: false, error: "Check-in cannot be in the past." };
  const nights = nightsBetween(checkIn, checkOut);
  const minStay = await getMinStayNights();
  if (!input.adminOverride && nights < minStay)
    return {
      ok: false,
      minStay: true,
      error: "Good things take time. Stay at least 3 nights and feel at home.",
    };
  if (input.adminOverride && !input.adminOverride.reason.trim())
    return { ok: false, error: "An override reason is required." };
  if (input.guestName.trim().length < 2)
    return { ok: false, error: "Please tell us your full name." };
  if (!/^\S+@\S+\.\S+$/.test(input.guestEmail))
    return { ok: false, error: "Please enter a valid email address." };
  if (input.guestPhone.replace(/\D/g, "").length < 9)
    return { ok: false, error: "Please enter a valid WhatsApp / phone number." };

  const typeRows = await db
    .select()
    .from(accommodationTypes)
    .where(eq(accommodationTypes.key, input.accommodationKey))
    .limit(1);
  const type = typeRows[0];
  if (!type) return { ok: false, error: "Accommodation type unavailable." };

  const plans = await getPlansFor(type.id);
  const quote = quoteStay(plans, nights, input.adminOverride ? 1 : minStay);
  if (!quote.ok) return { ok: false, error: quote.error, minStay: nights < minStay };
  const pricePending = !input.adminOverride && (await getHidePrices());
  const lines = pricePending ? [] : quote.lines;
  const totalPkr = pricePending ? 0 : quote.totalPkr;

  const avail = await getAvailability(checkIn, checkOut);
  return db.transaction(async (tx) => {
    const mine = avail.find((a) => a.key === input.accommodationKey);
    if (!mine || mine.availableUnits < 1)
      return {
        ok: false as const,
        error:
          "Those dates just filled up. Try different dates or the other accommodation type.",
      };

    // Lock inventory rows to serialize concurrent booking attempts.
    if (input.accommodationKey === "SHARED_BUNK") {
      await tx.execute(
        sql`SELECT id FROM beds WHERE id IN (${sql.join(
          mine.unitIds.map((id) => sql`${id}`),
          sql`, `
        )}) FOR UPDATE`
      );
    } else {
      await tx.execute(
        sql`SELECT id FROM rooms WHERE id IN (${sql.join(
          mine.unitIds.map((id) => sql`${id}`),
          sql`, `
        )}) FOR UPDATE`
      );
    }

    // Re-validate inside the lock (double-booking guard).
    const [freshOverlaps, freshBlocks] = await Promise.all([
      overlappingBookingUnitIds(checkIn, checkOut, tx),
      blockedUnitIds(checkIn, checkOut, tx),
    ]);
    const busy = new Set(
      input.accommodationKey === "SHARED_BUNK"
        ? freshOverlaps.bedIds.concat(freshBlocks.bedIds)
        : freshOverlaps.roomIds.concat(freshBlocks.roomIds)
    );
    const freeUnit = mine.unitIds.find((id) => !busy.has(id));
    if (freeUnit == null)
      return { ok: false as const, error: "Just sold out for those dates — please adjust." };

    const reference = genReference();
    const inserted = await tx
      .insert(bookings)
      .values({
        reference,
        propertyId: type.propertyId,
        accommodationTypeId: type.id,
        bedId: input.accommodationKey === "SHARED_BUNK" ? freeUnit : null,
        roomId: input.accommodationKey === "PRIVATE_ROOM" ? freeUnit : null,
        guestName: input.guestName.trim(),
        guestEmail: input.guestEmail.trim().toLowerCase(),
        guestPhone: input.guestPhone.trim(),
        guestsCount: Math.max(1, Math.min(4, input.guestsCount || 1)),
        checkIn,
        checkOut,
        nights,
        priceBreakdown: lines,
        totalPkr,
        pricePending,
        status: "PENDING_PAYMENT",
        minStayOverride: Boolean(input.adminOverride),
        minStayOverrideReason: input.adminOverride?.reason ?? null,
        source: input.source ?? "website",
        utm: input.utm ?? null,
      })
      .returning({ id: bookings.id });

    await tx.insert(payments).values({
      bookingId: inserted[0].id,
      kind: "STAY",
      method: input.paymentMethod,
      amountPkr: totalPkr,
      status: "PENDING",
    });

    return {
      ok: true as const,
      bookingId: inserted[0].id,
      reference,
      totalPkr,
      pricePending,
      nights,
    };
  });
}

export async function verifyResidentReference(
  reference: string,
  email: string
) {
  const rows = await db
    .select()
    .from(bookings)
    .where(eq(bookings.reference, reference.trim().toUpperCase()))
    .limit(1);
  const b = rows[0];
  if (!b) return null;
  if (b.guestEmail.toLowerCase() !== email.trim().toLowerCase()) return null;
  return b;
}

/** A booking counts as an active residency for discount validation. */
export function isActiveResident(b: {
  status: string;
  checkIn: string;
  checkOut: string;
}): boolean {
  const today = todayISO();
  if (b.status === "CHECKED_IN") return true;
  return (
    (b.status === "CONFIRMED" || b.status === "PENDING_PAYMENT") &&
    b.checkOut > today
  );
}

export async function bookingByReference(reference: string) {
  const rows = await db
    .select()
    .from(bookings)
    .where(eq(bookings.reference, reference.trim().toUpperCase()))
    .limit(1);
  return rows[0] ?? null;
}
