import { and, desc, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { beds, bookings, inventoryBlocks, rooms } from "@/db/schema";
import { removeInventoryBlock } from "@/app/admin/actions";
import { todayISO } from "@/lib/utils";
import { ActionButton, AdminBadge } from "@/components/admin/form-shell";
import { AddBlockForm } from "@/components/admin/rooms-form";

export default async function RoomsPage() {
  const today = todayISO();
  const [allRooms, allBeds, blocks, holding] = await Promise.all([
    db.select().from(rooms).orderBy(rooms.id),
    db.select().from(beds).orderBy(beds.id),
    db.select().from(inventoryBlocks).orderBy(desc(inventoryBlocks.startDate)),
    db
      .select()
      .from(bookings)
      .where(
        and(
          sql`${bookings.status} IN ('PENDING_PAYMENT','CONFIRMED','CHECKED_IN')`,
          sql`${bookings.checkIn} <= ${today}`,
          sql`${bookings.checkOut} > ${today}`
        )
      ),
  ]);

  const occupiedBeds = new Map(holding.filter((b) => b.bedId).map((b) => [b.bedId as number, b.guestName]));
  const occupiedRooms = new Map(holding.filter((b) => b.roomId).map((b) => [b.roomId as number, b.guestName]));
  const blockedBeds = new Set(blocks.filter((bl) => bl.bedId && bl.startDate <= today && bl.endDate > today).map((bl) => bl.bedId));
  const blockedRooms = new Set(blocks.filter((bl) => bl.roomId && bl.startDate <= today && bl.endDate > today).map((bl) => bl.roomId));
  const futureBlocks = blocks.filter((bl) => bl.endDate > today);

  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl tracking-tight">Rooms & Beds</h1>
      <p className="text-sm text-ink-soft mt-1">Live inventory — who&apos;s where, what&apos;s blocked.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        {allRooms.map((room) => (
          <div key={room.id} className="rounded-2xl border border-line bg-paper p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{room.name}</p>
              <AdminBadge tone={room.active ? "dark" : "neutral"}>{room.active ? room.type.replace("_", " ") : "inactive"}</AdminBadge>
            </div>
            <p className="text-[12px] text-ink-soft mt-1">Max occupants: {room.maxOccupants}</p>
            {room.type === "SHARED_BUNK" ? (
              <ul className="mt-3 space-y-1.5">
                {allBeds.filter((b) => b.roomId === room.id).map((bed) => (
                  <li key={bed.id} className="flex items-center justify-between text-sm rounded-lg bg-mist px-3 py-2">
                    <span className="font-mono text-[12.5px]">{bed.label}</span>
                    <span className="text-[12px] text-ink-soft">
                      {occupiedBeds.get(bed.id)
                        ? <span className="font-medium text-ink">{occupiedBeds.get(bed.id)}</span>
                        : blockedBeds.has(bed.id) ? "Blocked" : "Free"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm rounded-lg bg-mist px-3 py-2">
                {occupiedRooms.get(room.id)
                  ? <span className="font-medium">{occupiedRooms.get(room.id)}</span>
                  : blockedRooms.has(room.id) ? "Blocked today" : "Free today"}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6">
        <AddBlockForm
          roomOptions={allRooms.map((r) => ({ id: r.id, label: r.name }))}
          bedOptions={allBeds.map((b) => ({ id: b.id, label: `Bunk ${b.label}` }))}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-line bg-paper overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-[11px] tracking-[0.12em] uppercase text-ink-soft border-b border-line">
              <th className="px-5 py-3.5 font-semibold">Block</th>
              <th className="px-5 py-3.5 font-semibold">Dates</th>
              <th className="px-5 py-3.5 font-semibold">Reason</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {futureBlocks.map((bl) => (
              <tr key={bl.id} className="border-b border-line last:border-0 hover:bg-mist/60">
                <td className="px-5 py-3.5 font-medium">
                  {bl.bedId ? `Bunk ${allBeds.find((b) => b.id === bl.bedId)?.label ?? bl.bedId}` : `Room ${allRooms.find((r) => r.id === bl.roomId)?.name ?? bl.roomId}`}
                </td>
                <td className="px-5 py-3.5">{bl.startDate} → {bl.endDate}</td>
                <td className="px-5 py-3.5">{bl.reason}</td>
                <td className="px-5 py-3.5 text-right">
                  <ActionButton variant="danger" confirm="Remove this block?" action={removeInventoryBlock.bind(null, bl.id)}>
                    Remove
                  </ActionButton>
                </td>
              </tr>
            ))}
            {futureBlocks.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-ink-soft">No active or upcoming blocks.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
