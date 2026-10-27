import { config } from "dotenv";
config();
import { eq } from "drizzle-orm";

const EMAIL = "test.e2e@contentcolony.test";

async function main() {
  const { createBooking } = await import("../src/lib/stays");
  const { registerForEvent } = await import("../src/lib/actions");
  const { db } = await import("../src/db");
  const { bookings, payments, eventRegistrations, ghlSyncs, notifications, events } = await import("../src/db/schema");

  const results: string[] = [];
  const check = (n: string, c: boolean, x = "") => results.push(`${c ? "PASS" : "FAIL"} — ${n}${x ? ` (${x})` : ""}`);

  // Create an active booking (dates in the future = active residency)
  const b = await createBooking({
    accommodationKey: "SHARED_BUNK",
    checkIn: "2030-03-01", checkOut: "2030-03-08",
    guestName: "Discount Tester", guestEmail: EMAIL, guestPhone: "+923009998877",
    guestsCount: 1, paymentMethod: "RAAST",
  });
  check("resident booking created", b.ok, b.ok ? b.reference : b.error);
  if (!b.ok) process.exit(1);

  // 1. Wrong email + right reference → rejected
  const r1 = await registerForEvent({ eventSlug: "youtube-automation-abrar-nadir", name: "Discount Tester", email: "someone.else@test.dev", phone: "+923009998877", bookingReference: b.reference });
  check("self-declared resident discount REJECTED (email mismatch)", !r1.ok, !r1.ok ? r1.error : "");

  // 2. No reference → full price
  const r2 = await registerForEvent({ eventSlug: "youtube-automation-abrar-nadir", name: "Guest NoRef", email: "noref.e2e@test.dev", phone: "+923009998877" });
  check("non-resident pays full PKR 8,000", r2.ok && r2.amountDue === 8000 && r2.discountPct === 0, r2.ok ? String(r2.amountDue) : "");

  // 3. Verified resident → 25% off = 6,000
  const r3 = await registerForEvent({ eventSlug: "youtube-automation-abrar-nadir", name: "Discount Tester", email: EMAIL, phone: "+923009998877", bookingReference: b.reference });
  check("verified resident gets 25% off → PKR 6,000", r3.ok && r3.amountDue === 6000 && r3.discountPct === 25, r3.ok ? `due ${r3.amountDue}` : r3.error);

  // 4. Duplicate registration blocked
  const r4 = await registerForEvent({ eventSlug: "youtube-automation-abrar-nadir", name: "Discount Tester", email: EMAIL, phone: "+923009998877", bookingReference: b.reference });
  check("duplicate registration blocked", !r4.ok, !r4.ok ? r4.error : "");

  // 5. Free community event confirmed instantly
  const r5 = await registerForEvent({ eventSlug: "friday-movie-night", name: "Movie Fan", email: "movie.e2e@test.dev", phone: "+923009998877" });
  check("free event auto-confirmed (free=true, due=0)", r5.ok && r5.free && r5.amountDue === 0);

  // 6. GHL sync queue received the leads
  const syncs = await db.select().from(ghlSyncs);
  check("leads durably queued for GHL (registrations)", syncs.length >= 3, `${syncs.length} rows`);
  const notifs = await db.select().from(notifications);
  check("notification queue has messages", notifs.length >= 2, `${notifs.length} rows`);

  // Cleanup
  await db.delete(eventRegistrations).where(eq(eventRegistrations.email, EMAIL));
  await db.delete(eventRegistrations).where(eq(eventRegistrations.email, "noref.e2e@test.dev"));
  await db.delete(eventRegistrations).where(eq(eventRegistrations.email, "movie.e2e@test.dev"));
  const [testBooking] = await db.select().from(bookings).where(eq(bookings.guestEmail, EMAIL));
  if (testBooking) await db.delete(payments).where(eq(payments.bookingId, testBooking.id));
  await db.delete(bookings).where(eq(bookings.guestEmail, EMAIL));
  for (const reg of [r2, r3, r5]) if (reg.ok && "registrationId" in reg) await db.delete(payments).where(eq(payments.eventRegistrationId, reg.registrationId));
  await db.delete(ghlSyncs);
  await db.delete(notifications);

  console.log(results.join("\n"));
  const failed = results.filter((r) => r.startsWith("FAIL"));
  console.log(failed.length ? `\n${failed.length} FAILURES` : "\nALL DISCOUNT TESTS PASSED");
  process.exit(failed.length ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
