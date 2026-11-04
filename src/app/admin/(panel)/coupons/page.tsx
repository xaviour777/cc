import { desc } from "drizzle-orm";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { createCoupon, setCouponActive } from "@/app/admin/actions";
import { ActionButton, AdminBadge, FormShell } from "@/components/admin/form-shell";
import { pkr, todayISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const list = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  const today = todayISO();

  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl tracking-tight">Coupons</h1>
      <p className="text-sm text-ink-soft mt-1">
        Create discount codes. Guests type the code while booking and see the reduced price straight away.
      </p>

      <div className="mt-6 rounded-2xl border border-line bg-paper p-5">
        <p className="font-semibold text-sm">New coupon</p>
        <FormShell action={createCoupon} submitLabel="Create coupon" resetOnSuccess className="mt-4">
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="label">Code</label>
              <input name="code" className="field uppercase" placeholder="COLONY10" required />
            </div>
            <div>
              <label className="label">Discount type</label>
              <select name="kind" className="field" defaultValue="PERCENT">
                <option value="PERCENT">Percent (%)</option>
                <option value="FIXED">Fixed amount (PKR)</option>
              </select>
            </div>
            <div>
              <label className="label">Value</label>
              <input name="value" type="number" min={1} className="field" placeholder="10" required />
            </div>
            <div>
              <label className="label">Use on</label>
              <select name="appliesTo" className="field" defaultValue="STAY">
                <option value="STAY">Stays</option>
                <option value="EVENT">Events</option>
                <option value="ALL">Stays and events</option>
              </select>
            </div>
            <div>
              <label className="label">Minimum nights (optional)</label>
              <input name="minNights" type="number" min={0} className="field" />
            </div>
            <div>
              <label className="label">Max uses (optional)</label>
              <input name="maxUses" type="number" min={0} className="field" />
            </div>
            <div>
              <label className="label">Last valid day (optional)</label>
              <input name="expiresOn" type="date" className="field" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Note (only admins see this)</label>
              <input name="note" className="field" placeholder="e.g. Instagram launch offer" />
            </div>
          </div>
        </FormShell>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-paper overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="text-left text-[11px] tracking-[0.12em] uppercase text-ink-soft border-b border-line">
              <th className="px-5 py-3.5 font-semibold">Code</th>
              <th className="px-5 py-3.5 font-semibold">Discount</th>
              <th className="px-5 py-3.5 font-semibold">Use on</th>
              <th className="px-5 py-3.5 font-semibold">Used</th>
              <th className="px-5 py-3.5 font-semibold">Valid until</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {list.map((c) => {
              const expired = Boolean(c.expiresOn && c.expiresOn < today);
              const usedUp = c.maxUses != null && c.usedCount >= c.maxUses;
              const live = c.active && !expired && !usedUp;
              return (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3.5">
                    <p className="font-mono font-semibold">{c.code}</p>
                    {c.note && <p className="text-[12px] text-ink-soft">{c.note}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    {c.kind === "FIXED" ? pkr(c.value) : `${c.value}%`}
                    {c.minNights ? <span className="text-ink-soft"> · {c.minNights}+ nights</span> : null}
                  </td>
                  <td className="px-5 py-3.5">
                    {c.appliesTo === "ALL" ? "Stays + events" : c.appliesTo === "EVENT" ? "Events" : "Stays"}
                  </td>
                  <td className="px-5 py-3.5">
                    {c.usedCount}
                    {c.maxUses != null ? ` / ${c.maxUses}` : ""}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">{c.expiresOn ?? "No end date"}</td>
                  <td className="px-5 py-3.5">
                    <AdminBadge tone={live ? "dark" : "neutral"}>
                      {live ? "Live" : !c.active ? "Off" : expired ? "Expired" : "Used up"}
                    </AdminBadge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <ActionButton action={setCouponActive.bind(null, c.id, !c.active)}>
                      {c.active ? "Turn off" : "Turn on"}
                    </ActionButton>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-ink-soft">
                  No coupons yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
