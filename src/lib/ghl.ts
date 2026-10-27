import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { ghlSyncs, notifications } from "@/db/schema";

/**
 * GoHighLevel lead sync queue.
 * The app database stays authoritative; every lead is persisted first, then
 * pushed to HighLevel's supported v2 API (services.leadconnectorhq.com,
 * Version header) when credentials exist. Failures never lose a lead — rows
 * stay PENDING/FAILED and are retryable from the admin dashboard.
 */

const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

type GhlEnv = { apiKey: string; locationId: string } | null;
function ghlEnv(): GhlEnv {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!apiKey || !locationId) return null;
  return { apiKey, locationId };
}

export async function queueLeadSync(input: {
  entityType: "booking" | "registration" | "proposal" | "contact";
  entityId: number;
  name: string;
  email: string;
  phone?: string;
  tags: string[];
  source?: string;
  notes?: string;
  utm?: Record<string, string> | null;
}) {
  // Deduplication: skip if an open (pending/sent) sync already exists.
  const existing = await db
    .select({ id: ghlSyncs.id })
    .from(ghlSyncs)
    .where(
      and(
        eq(ghlSyncs.entityType, input.entityType),
        eq(ghlSyncs.entityId, input.entityId),
        inArray(ghlSyncs.status, ["PENDING", "SENT"])
      )
    )
    .limit(1);
  if (existing.length > 0) return existing[0].id;

  const inserted = await db
    .insert(ghlSyncs)
    .values({
      entityType: input.entityType,
      entityId: input.entityId,
      email: input.email,
      name: input.name,
      payload: {
        phone: input.phone ?? null,
        tags: input.tags,
        source: input.source ?? "Content Colony Website",
        notes: input.notes ?? null,
        utm: input.utm ?? null,
      },
      status: "PENDING",
    })
    .returning({ id: ghlSyncs.id });

  await attemptSync(inserted[0].id);
  return inserted[0].id;
}

export async function attemptSync(id: number): Promise<boolean> {
  const rows = await db.select().from(ghlSyncs).where(eq(ghlSyncs.id, id)).limit(1);
  const sync = rows[0];
  if (!sync) return false;
  const env = ghlEnv();
  if (!env) {
    await db
      .update(ghlSyncs)
      .set({
        status: "SKIPPED",
        lastError: "GHL_API_KEY / GHL_LOCATION_ID not configured — lead retained for retry.",
        updatedAt: new Date(),
      })
      .where(eq(ghlSyncs.id, id));
    return false;
  }
  const payload = sync.payload as {
    phone?: string | null;
    tags?: string[];
    source?: string;
    notes?: string | null;
    utm?: Record<string, string> | null;
  };
  try {
    const res = await fetch(`${GHL_BASE}/contacts/upsert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.apiKey}`,
        "Content-Type": "application/json",
        Version: GHL_VERSION,
      },
      body: JSON.stringify({
        locationId: env.locationId,
        email: sync.email,
        name: sync.name,
        phone: payload.phone ?? undefined,
        tags: payload.tags ?? [],
        source: payload.source ?? "Content Colony Website",
        customFields: payload.utm
          ? Object.entries(payload.utm).map(([key, value]) => ({ key, field_value: value }))
          : undefined,
      }),
    });
    if (!res.ok) throw new Error(`GHL ${res.status}: ${(await res.text()).slice(0, 300)}`);
    await db
      .update(ghlSyncs)
      .set({ status: "SENT", attempts: sync.attempts + 1, lastError: null, updatedAt: new Date() })
      .where(eq(ghlSyncs.id, id));
    return true;
  } catch (err) {
    await db
      .update(ghlSyncs)
      .set({
        status: "FAILED",
        attempts: sync.attempts + 1,
        lastError: err instanceof Error ? err.message : String(err),
        updatedAt: new Date(),
      })
      .where(eq(ghlSyncs.id, id));
    return false;
  }
}

export async function retryPendingSyncs(): Promise<number> {
  const rows = await db
    .select({ id: ghlSyncs.id })
    .from(ghlSyncs)
    .where(inArray(ghlSyncs.status, ["PENDING", "FAILED", "SKIPPED"]))
    .limit(25);
  let sent = 0;
  for (const r of rows) if (await attemptSync(r.id)) sent++;
  return sent;
}

export async function recordNotification(input: {
  channel: "EMAIL" | "WHATSAPP";
  to: string;
  subject: string;
  body: string;
  entityType?: string;
  entityId?: number;
}) {
  // Provider credentials (transactional email / WhatsApp Business API) are
  // pending owner authorization — messages are durably queued and visible in
  // admin, never silently dropped.
  await db.insert(notifications).values({
    channel: input.channel,
    toRef: input.to,
    subject: input.subject,
    body: input.body,
    status: "QUEUED",
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
  });
}
