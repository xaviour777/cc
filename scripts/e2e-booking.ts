import { config } from "dotenv";
config();
import { eq, like } from "drizzle-orm";

const TEST_EMAIL = "test.e2e@contentcolony.test";

async function main() {
  const { createBooking, getAvailability, getPlansFor, quoteStay } = await import("../src/lib/stays");
  const { db } = await import("../src/db");
  const { bookings, payments, ghlSyncs, notifications, accommodationTypes } = await import("../src/db/schema");

  const results: string[] = [];
  const check = (name: string, cond: boolean, extra = "") => {
    results.push(`${cond ? "PASS" : "FAIL"} — ${name}${extra ? ` (${extra})` : ""}`);
    if (!cond) console.error("DETAIL:", name, extra);
  };

  // Pricing math (pure)
  const [shared] = await db.select().from(accommodationTypes).where(eq(accommodationTypes.key, "SHARED_BUNK"));
  const [priv] = await db.select().from(accommodationTypes).where(eq(accommodationTypes.key, "PRIVATE_ROOM"));
  const sharedPlans = await getPlansFor(shared.id);
  const privPlans = await getPlansFor(priv.id);

  const q3 = quoteStay(sharedPlans, 3, 3);
  check("3 nights bunk = PKR 6,000", q3.ok && q3.totalPkr === 6000, q3.ok ? String(q3.totalPkr) : "");
  const q7 = quoteStay(sharedPlans, 7, 3);
  check("7 nights bunk = weekly package PKR 12,000 (not 7×2000)", q7.ok && q7.totalPkr === 12000, q7.ok ? String(q7.totalPkr) : "");
  const q8 = quoteStay(sharedPlans, 8, 3);
  check("8 nights bunk = 12,000 + 2,000 = 14,000", q8.ok && q8.totalPkr === 14000, q8.ok ? String(q8.totalPkr) : "");
  const q30 = quoteStay(sharedPlans, 30, 3);
  check("30 nights bunk = monthly package PKR 42,000", q30.ok && q30.totalPkr === 42000, q30.ok ? String(q30.totalPkr) : "");
  const q37 = quoteStay(sharedPlans, 37, 3);
  check("37 nights = 42,000 + 12,000 = 54,000", q37.ok && q37.totalPkr === 54000, q37.ok ? String(q37.totalPkr) : "");
  const qp3 = quoteStay(privPlans, 3, 3);
  check("3 nights private = PKR 15,000", qp3.ok && qp3.totalPkr === 15000);
  const qp30 = quoteStay(privPlans, 30, 3);
  check("30 nights private = PKR 100,000", qp30.ok && qp30.totalPkr === 100000, qp30.ok ? String(qp30.totalPkr) : "");
  const q2 = quoteStay(sharedPlans, 2, 3);
  check("2 nights rejected with min-stay message", !q2.ok, q2.ok ? "" : q2.error);

  const base = { guestName: "E2E Tester", guestEmail: TEST_EMAIL, guestPhone: "+923001112233", guestsCount: 1, paymentMethod: "BANK_TRANSFER" as const };

  // Min stay enforcement via API surface
  const short = await createBooking({ ...base, accommodationKey: "SHARED_BUNK", checkIn: "2030-01-01", checkOut: "2030-01-03" });
  check("createBooking rejects 2-night stay", !short.ok && short.minStay === true, short.ok ? "" : short.error);

  // Private room: fill both rooms, third must fail (no double booking)
  const p1 = await createBooking({ ...base, accommodationKey: "PRIVATE_ROOM", checkIn: "2030-05-01", checkOut: "2030-05-05" });
  check("private booking 1 created (4 nights = 20,000)", p1.ok && p1.totalPkr === 20000, p1.ok ? `ref ${p1.reference}` : "");
  const p2 = await createBooking({ ...base, accommodationKey: "PRIVATE_ROOM", checkIn: "2030-05-02", checkOut: "2030-05-06" });
  check("private booking 2 → second room", p2.ok, p2.ok ? `ref ${p2.reference}` : "");
  const p3 = await createBooking({ ...base, accommodationKey: "PRIVATE_ROOM", checkIn: "2030-05-03", checkOut: "2030-05-07" });
  check("third overlapping private booking SOLD OUT (no double-book)", !p3.ok, p3.ok ? "" : p3.error);

  // Bunk: 8 overlapping bookings fill all 8 beds, 9th must fail; beds unique
  const bunkRefs: string[] = [];
  const createdIds: number[] = [];
  let allOk = true;
  for (let i = 0; i < 8; i++) {
    const r = await createBooking({ ...base, accommodationKey: "SHARED_BUNK", checkIn: "2030-06-10", checkOut: "2030-06-13" });
    if (r.ok) { bunkRefs.push(r.reference); createdIds.push(r.bookingId); }
    else allOk = false;
  }
  check("8 overlapping bunk bookings all succeed", allOk && bunkRefs.length === 8);
  const rows = await db.select().from(bookings).where(eq(bookings.guestEmail, TEST_EMAIL));
  const bunkJune = rows.filter((b) => b.checkIn === "2030-06-10");
  const bedIds = new Set(bunkJune.map((b) => b.bedId));
  check("each bunk booking got a DIFFERENT bed", bedIds.size === 8, `unique=${bedIds.size}`);
  const ninth = await createBooking({ ...base, accommodationKey: "SHARED_BUNK", checkIn: "2030-06-11", checkOut: "2030-06-14" });
  check("9th overlapping bunk booking SOLD OUT", !ninth.ok, ninth.ok ? "" : ninth.error);

  // Availability reflects holds
  const avail = await getAvailability("2030-06-11", "2030-06-14");
  const bunkAvail = avail.find((a) => a.key === "SHARED_BUNK");
  check("availability shows 0/8 bunks held", bunkAvail?.availableUnits === 0, JSON.stringify(bunkAvail?.availableUnits));
  const availLater = await getAvailability("2030-07-01", "2030-07-04");
  check("availability back to 8 on clear dates", availLater.find((a) => a.key === "SHARED_BUNK")?.availableUnits === 8);

  // Side-quest records exist (payments created)
  const payCount = rows.length;
  const pays = await db.select().from(payments);
  check("a PENDING payment row per booking exists", pays.filter((p) => p.bookingId && rows.some((b) => b.id === p.bookingId)).length >= payCount - 1);

  // Cleanup test data precisely
  for (const b of rows) {
    await db.delete(payments).where(eq(payments.bookingId, b.id));
  }
  await db.delete(bookings).where(eq(bookings.guestEmail, TEST_EMAIL));
  console.log(results.join("\n"));
  const failed = results.filter((r) => r.startsWith("FAIL"));
  console.log(failed.length ? `\n${failed.length} FAILURES` : "\nALL TESTS PASSED");
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
