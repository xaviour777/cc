import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch (e) {
    // Report only the driver's reason (e.g. "password authentication failed"),
    // never the connection string.
    const cause = (e as { cause?: { message?: string; code?: string } }).cause;
    return Response.json(
      { ok: false, reason: cause?.message ?? "database query failed", code: cause?.code ?? null },
      { status: 500 }
    );
  }
}
