import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { ghlSyncs, notifications } from "@/db/schema";
import { sendMail } from "@/lib/mailer";
import { getSetting } from "@/lib/stays";

/** The team inbox that gets a copy of every booking / event email. */
export async function teamInbox(): Promise<string> {
  return String(await getSetting<string>("contactEmail", "hello@contentcolony.live"));
}

/**
 * GoHighLevel lead sync queue.
 * The app database stays authoritative; every lead is persisted first, then
 * pushed to HighLevel's supported v2 API (services.leadconnectorhq.com,
 * Version header) when credentials exist. Failures never lose a lead — rows
 * stay PENDING/FAILED and are retryable from the admin dashboard.
 */

const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

// Vercel env vars (Zetomate sub-account):
//   GHL_API_KEY            Private Integration token of the sub-account
//                          (scopes: contacts.write, opportunities.read/write)
//   GHL_LOCATION_ID        the sub-account (location) id
//   GHL_PIPELINE_ID        optional; pipeline for new opportunities. Without it
//                          the pipeline whose name has "colony" (else the first) is used.
//   GHL_PIPELINE_STAGE_ID  optional; default is the pipeline's first stage.
// Without the first two nothing is sent and leads wait in admin for a retry.
type GhlEnv = { apiKey: string; locationId: string } | null;
function ghlEnv(): GhlEnv {
  const apiKey = process.env.GHL_API_KEY?.trim();
  const locationId = process.env.GHL_LOCATION_ID?.trim();
  if (!apiKey || !locationId) return null;
  return { apiKey, locationId };
}

export function ghlConfigured() {
  return Boolean(ghlEnv());
}

function ghlHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    Version: GHL_VERSION,
  };
}

type Pipeline = { id: string; name: string; stages: { id: string; name: string }[] };

async function resolvePipeline(env: { apiKey: string; locationId: string }) {
  const wantedPipeline = process.env.GHL_PIPELINE_ID?.trim();
  const wantedStage = process.env.GHL_PIPELINE_STAGE_ID?.trim();
  if (wantedPipeline && wantedStage) return { pipelineId: wantedPipeline, stageId: wantedStage };
  const res = await fetch(`${GHL_BASE}/opportunities/pipelines?locationId=${encodeURIComponent(env.locationId)}`, {
    headers: ghlHeaders(env.apiKey),
  });
  if (!res.ok) throw new Error(`GHL pipelines ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const list = ((await res.json()) as { pipelines?: Pipeline[] }).pipelines ?? [];
  const pipeline =
    (wantedPipeline && list.find((p) => p.id === wantedPipeline)) ||
    list.find((p) => /colony/i.test(p.name)) ||
    list[0];
  if (!pipeline) throw new Error("GHL: no pipeline found in this sub-account — create one in Opportunities.");
  const stageId = wantedStage || pipeline.stages?.[0]?.id;
  if (!stageId) throw new Error(`GHL: pipeline "${pipeline.name}" has no stages.`);
  return { pipelineId: pipeline.id, stageId };
}

export async function queueLeadSync(input: {
  entityType: "booking" | "registration" | "proposal" | "contact" | "pass";
  entityId: number;
  name: string;
  email: string;
  phone?: string;
  tags: string[];
  source?: string;
  notes?: string;
  utm?: Record<string, string> | null;
  /** When set, an opportunity is also created in the GHL pipeline. */
  opportunity?: { name: string; monetaryValue?: number };
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
        opportunity: input.opportunity ?? null,
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
    opportunity?: { name: string; monetaryValue?: number } | null;
    opportunityId?: string;
  };
  try {
    const res = await fetch(`${GHL_BASE}/contacts/upsert`, {
      method: "POST",
      headers: ghlHeaders(env.apiKey),
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
    const contactId = ((await res.json()) as { contact?: { id?: string } }).contact?.id;

    if (payload.opportunity && !payload.opportunityId) {
      if (!contactId) throw new Error("GHL: contact upsert returned no id");
      const { pipelineId, stageId } = await resolvePipeline(env);
      const opp = await fetch(`${GHL_BASE}/opportunities/`, {
        method: "POST",
        headers: ghlHeaders(env.apiKey),
        body: JSON.stringify({
          locationId: env.locationId,
          pipelineId,
          pipelineStageId: stageId,
          name: payload.opportunity.name,
          status: "open",
          contactId,
          monetaryValue: payload.opportunity.monetaryValue || undefined,
          source: payload.source ?? "Content Colony Website",
        }),
      });
      if (!opp.ok) throw new Error(`GHL opportunity ${opp.status}: ${(await opp.text()).slice(0, 300)}`);
      const oppId = ((await opp.json()) as { opportunity?: { id?: string } }).opportunity?.id;
      await db
        .update(ghlSyncs)
        .set({ payload: { ...payload, opportunityId: oppId ?? "created" } })
        .where(eq(ghlSyncs.id, id));
    }
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
  /** false = don't copy the team inbox (e.g. password links). */
  copyTeam?: boolean;
}) {
  // Email goes out through SMTP when configured (see lib/mailer.ts);
  // otherwise, and for WhatsApp, the message stays QUEUED in admin.
  const sent = input.channel === "EMAIL" ? await sendMail(input.to, input.subject, input.body) : false;
  await db.insert(notifications).values({
    channel: input.channel,
    toRef: input.to,
    subject: input.subject,
    body: input.body,
    status: sent ? "SENT" : "QUEUED",
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    sentAt: sent ? new Date() : null,
  });
  if (input.channel === "EMAIL" && input.copyTeam !== false) {
    const team = await teamInbox();
    if (team && team.toLowerCase() !== input.to.toLowerCase())
      await sendMail(team, `[Copy] ${input.subject}`, `Sent to: ${input.to}\n\n${input.body}`);
  }
}
