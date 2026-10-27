import { desc } from "drizzle-orm";
import { db } from "@/db";
import {
  accommodationTypes,
  agreements,
  ghlSyncs,
  notifications,
  properties,
  ratePlans,
  siteSettings,
} from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { updateProperty, upsertAgreement } from "@/app/admin/actions";
import { AdminBadge, FormShell } from "@/components/admin/form-shell";
import { RatePlanEditor, SecurityPanel, SiteSettingsForm } from "@/components/admin/settings-forms";

export default async function SettingsPage() {
  const user = await getSessionUser();
  const [settingsRows, plans, types, [property], [latestAgreement], syncs, notifs] = await Promise.all([
    db.select().from(siteSettings),
    db.select().from(ratePlans),
    db.select().from(accommodationTypes),
    db.select().from(properties).limit(1),
    db.select().from(agreements).orderBy(desc(agreements.version)).limit(1),
    db.select().from(ghlSyncs).orderBy(desc(ghlSyncs.createdAt)).limit(20),
    db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(20),
  ]);

  const settings: Record<string, string | number> = {};
  for (const s of settingsRows) {
    const v = s.value;
    settings[s.key] = typeof v === "string" || typeof v === "number" ? v : JSON.stringify(v);
  }

  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl tracking-tight">Settings</h1>
      <p className="text-sm text-ink-soft mt-1">
        Prices, content, socials, address publishing and security — no code changes needed.
      </p>

      <div className="grid lg:grid-cols-2 gap-4 mt-6 items-start">
        <div className="space-y-4">
          <SiteSettingsForm initial={settings} />
          <RatePlanEditor plans={plans} types={types.map((t) => ({ id: t.id, name: t.name }))} />
          {property && (
            <div className="rounded-2xl border border-line bg-paper p-5">
              <p className="font-semibold text-sm">Property & map</p>
              <p className="text-[12px] text-ink-soft mt-1">
                The exact address only appears publicly once you tick &quot;published&quot; — the owner&apos;s call.
              </p>
              <FormShell action={updateProperty} className="mt-4 space-y-3" submitLabel="Save property">
                <input type="hidden" name="id" value={property.id} />
                <div>
                  <label className="label">Full address (private until published)</label>
                  <input name="address" className="field" defaultValue={property.address ?? ""} placeholder="House, street, H Block, Johar Town, Lahore" />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="addressApproved" className="accent-black" defaultChecked={property.addressApproved} />
                  Publish the exact address on the website
                </label>
                <div>
                  <label className="label">Google Maps embed URL</label>
                  <input name="mapEmbedUrl" className="field" defaultValue={property.mapEmbedUrl ?? ""} />
                </div>
                <div>
                  <label className="label">Directions URL</label>
                  <input name="mapDirectionsUrl" className="field" defaultValue={property.mapDirectionsUrl ?? ""} />
                </div>
              </FormShell>
            </div>
          )}
          <SecurityPanel mfaEnabled={user?.mfaEnabled ?? false} email={user?.email ?? ""} />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-paper p-5">
            <p className="font-semibold text-sm">Stay agreement template</p>
            <p className="text-[12px] text-ink-soft mt-1 mb-3">
              Saving publishes a new version. Signed copies always keep the version the guest signed (v{latestAgreement?.version ?? 1} active).
              Placeholders: {"{{guest_name}} {{reference}} {{check_in}} {{check_out}} {{nights}} {{accommodation}} {{total}} {{version}} {{signed_at}}"}
            </p>
            <FormShell action={upsertAgreement} submitLabel="Publish new version">
              <textarea
                name="body"
                className="field min-h-56 font-mono text-[12.5px]"
                defaultValue={latestAgreement?.body ?? ""}
              />
            </FormShell>
          </div>

          <div className="rounded-2xl border border-line bg-paper p-5">
            <p className="font-semibold text-sm">GoHighLevel lead sync</p>
            <p className="text-[12px] text-ink-soft mt-1 mb-3">
              {process.env.GHL_API_KEY && process.env.GHL_LOCATION_ID
                ? "Live — new leads push immediately via the supported v2 API."
                : "Set GHL_API_KEY + GHL_LOCATION_ID environment variables to go live. Until then, every booking, registration, proposal and contact safely queues here. Identity documents are NEVER synced."}
            </p>
            <div className="space-y-2">
              {syncs.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-mist px-4 py-2.5 text-[12.5px]">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.name} · {s.entityType}</p>
                    <p className="text-ink-soft truncate">{s.email}{s.lastError ? ` · ${s.lastError.slice(0, 60)}` : ""}</p>
                  </div>
                  <AdminBadge tone={s.status === "SENT" ? "dark" : "neutral"}>{s.status}</AdminBadge>
                </div>
              ))}
              {syncs.length === 0 && <p className="text-sm text-ink-soft">No leads yet.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-paper p-5">
            <p className="font-semibold text-sm">Notification queue</p>
            <p className="text-[12px] text-ink-soft mt-1 mb-3">
              Email & WhatsApp messages queue here until provider credentials (Resend/SMTP, WhatsApp Business API)
              are authorized. Nothing is dropped — everything is auditable.
            </p>
            <div className="space-y-2">
              {notifs.map((n) => (
                <div key={n.id} className="rounded-xl bg-mist px-4 py-2.5 text-[12.5px]">
                  <p className="font-medium">{n.channel} → {n.toRef}</p>
                  <p className="text-ink-soft">{n.subject}</p>
                </div>
              ))}
              {notifs.length === 0 && <p className="text-sm text-ink-soft">Queue is empty.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
