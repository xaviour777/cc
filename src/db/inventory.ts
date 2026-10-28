import { config } from "dotenv";
config();
import { eq } from "drizzle-orm";
import { db, closeDb } from "./index";
import { accommodationTypes, inventoryBlocks, properties, rooms, siteSettings } from "./schema";

// One-time inventory updates. Safe to run again: each step only applies once.
const PRIVATE_ROOMS = 3;
const NOVEMBER = { start: "2026-11-01", end: "2026-12-01", reason: "Booked — November 2026" };

async function main() {
  const [property] = await db.select().from(properties).orderBy(properties.id).limit(1);
  if (!property) throw new Error("Run the seed first (npm run db:setup).");

  // 1. Three private rooms
  const privateRooms = await db.select().from(rooms).where(eq(rooms.type, "PRIVATE_ROOM"));
  for (let n = privateRooms.length + 1; n <= PRIVATE_ROOMS; n++) {
    await db
      .insert(rooms)
      .values({ propertyId: property.id, name: `Private Room ${n}`, type: "PRIVATE_ROOM", maxOccupants: 2 });
    console.log(`  added Private Room ${n}`);
  }
  const allPrivate = await db.select().from(rooms).where(eq(rooms.type, "PRIVATE_ROOM"));
  await db
    .update(accommodationTypes)
    .set({ capacityLabel: `${allPrivate.length} rooms in the colony · up to 2 occupants each` })
    .where(eq(accommodationTypes.key, "PRIVATE_ROOM"));

  // 2. All private rooms already booked for November (added once; admin can remove them)
  const done = await db.select().from(siteSettings).where(eq(siteSettings.key, "novemberBlocksAdded"));
  if (done.length === 0) {
    for (const room of allPrivate)
      await db.insert(inventoryBlocks).values({
        roomId: room.id,
        startDate: NOVEMBER.start,
        endDate: NOVEMBER.end,
        reason: NOVEMBER.reason,
      });
    await db.insert(siteSettings).values({ key: "novemberBlocksAdded", value: true as never });
    console.log(`  marked ${allPrivate.length} private rooms booked for November`);
  }

  // 3. Prices hidden by default (pre-booking + WhatsApp); switch in Admin → Settings
  await db
    .insert(siteSettings)
    .values({ key: "hidePrices", value: "yes" as never })
    .onConflictDoNothing();

  console.log("Inventory ready.");
  await closeDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
