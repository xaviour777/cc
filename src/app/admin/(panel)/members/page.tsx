import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, eventRegistrations, users } from "@/db/schema";
import { AdminBadge } from "@/components/admin/form-shell";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const [members, bks, regs] = await Promise.all([
    db.select().from(users).where(eq(users.role, "USER")).orderBy(desc(users.createdAt)),
    db.select({ email: bookings.guestEmail, status: bookings.status }).from(bookings),
    db.select({ email: eventRegistrations.email }).from(eventRegistrations),
  ]);

  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl tracking-tight">Members</h1>
      <p className="text-sm text-ink-soft mt-1">
        A guest becomes a member when you confirm their first payment. They get an email (and you can send a WhatsApp link
        from the booking page) to set a password, then sign in at /account to see their stays and book again.
      </p>
      <div className="mt-6 rounded-2xl border border-line bg-paper overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="text-left text-[11px] tracking-[0.12em] uppercase text-ink-soft border-b border-line">
              <th className="px-5 py-3.5 font-semibold">Member</th>
              <th className="px-5 py-3.5 font-semibold">Phone</th>
              <th className="px-5 py-3.5 font-semibold">Stays</th>
              <th className="px-5 py-3.5 font-semibold">Events</th>
              <th className="px-5 py-3.5 font-semibold">Since</th>
              <th className="px-5 py-3.5 font-semibold">Login</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-line last:border-0">
                <td className="px-5 py-3.5">
                  <p className="font-medium">{m.name}</p>
                  <p className="text-[12px] text-ink-soft">{m.email}</p>
                </td>
                <td className="px-5 py-3.5">{m.phone ?? "—"}</td>
                <td className="px-5 py-3.5">{bks.filter((b) => b.email === m.email && b.status !== "CANCELLED").length}</td>
                <td className="px-5 py-3.5">{regs.filter((r) => r.email === m.email).length}</td>
                <td className="px-5 py-3.5 whitespace-nowrap">{m.createdAt.toLocaleDateString("en-GB")}</td>
                <td className="px-5 py-3.5">
                  <AdminBadge tone={m.passwordHash.includes(":") ? "dark" : "neutral"}>
                    {m.passwordHash.includes(":") ? "Active" : "Password not set"}
                  </AdminBadge>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink-soft">
                  No members yet. Confirm a guest&apos;s payment to create the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
