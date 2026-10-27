import Link from "next/link";
import { desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { eventRegistrations, events } from "@/db/schema";
import { deleteEvent, setEventStatus } from "@/app/admin/actions";
import { formatDate, pkr } from "@/lib/utils";
import { ActionButton, AdminBadge } from "@/components/admin/form-shell";
import EventEditor from "@/components/admin/event-editor";

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; new?: string }>;
}) {
  const { edit, new: isNew } = await searchParams;
  const [rows, regs] = await Promise.all([
    db.select().from(events).orderBy(desc(events.createdAt)),
    db.select().from(eventRegistrations).where(ne(eventRegistrations.status, "CANCELLED")),
  ]);
  const taken = (id: number) => regs.filter((r) => r.eventId === id).length;
  const editing = edit ? rows.find((e) => e.id === Number(edit)) : undefined;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight">Events</h1>
          <p className="text-sm text-ink-soft mt-1">Workshops, meetups and community nights. Nothing public without PUBLISHED status.</p>
        </div>
        <Link href="/admin/events?new=1" className="btn btn-primary !py-2.5 !px-5 text-sm">
          New event
        </Link>
      </div>

      {(isNew || editing) && (
        <div className="mt-5">
          <EventEditor event={editing} />
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-line bg-paper overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-left text-[11px] tracking-[0.12em] uppercase text-ink-soft border-b border-line">
              <th className="px-5 py-3.5 font-semibold">Event</th>
              <th className="px-5 py-3.5 font-semibold">When</th>
              <th className="px-5 py-3.5 font-semibold">Seats</th>
              <th className="px-5 py-3.5 font-semibold">Ticket</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} className="border-b border-line last:border-0 hover:bg-mist/60">
                <td className="px-5 py-3.5">
                  <p className="font-medium">{e.title}</p>
                  <p className="text-[12px] text-ink-soft">
                    {e.kind} · {e.category}
                    {e.hostName ? ` · ${e.hostName}` : ""}{e.featured ? " · featured" : ""}
                  </p>
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap">{e.startDate ? formatDate(e.startDate) : "Dates TBA"}</td>
                <td className="px-5 py-3.5">{taken(e.id)}/{e.capacity}</td>
                <td className="px-5 py-3.5">{e.ticketPkr > 0 ? pkr(e.ticketPkr) : "Free"}</td>
                <td className="px-5 py-3.5">
                  <AdminBadge tone={e.status === "PUBLISHED" ? "dark" : "neutral"}>{e.status}</AdminBadge>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-1.5 justify-end">
                    <Link href={`/admin/events?edit=${e.id}`} className="inline-flex items-center rounded-full px-3.5 py-1.5 text-[12.5px] font-medium border border-line hover:border-ink transition-colors">
                      Edit
                    </Link>
                    {e.status !== "PUBLISHED" && (
                      <ActionButton variant="primary" action={setEventStatus.bind(null, e.id, "PUBLISHED")}>Publish</ActionButton>
                    )}
                    {e.status === "PUBLISHED" && (
                      <ActionButton action={setEventStatus.bind(null, e.id, "DRAFT")}>Unpublish</ActionButton>
                    )}
                    <ActionButton variant="danger" confirm={`Delete "${e.title}" and its registrations link?`} action={deleteEvent.bind(null, e.id)}>
                      Delete
                    </ActionButton>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-ink-soft">No events yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="font-display font-bold text-xl tracking-tight mt-10">Registrations</h2>
      <RegistrationsTable />
    </div>
  );
}

async function RegistrationsTable() {
  const [regs, evs] = await Promise.all([
    db.select().from(eventRegistrations).orderBy(desc(eventRegistrations.createdAt)).limit(100),
    db.select().from(events),
  ]);
  return (
    <div className="mt-4 rounded-2xl border border-line bg-paper overflow-x-auto">
      <table className="w-full text-sm min-w-[800px]">
        <thead>
          <tr className="text-left text-[11px] tracking-[0.12em] uppercase text-ink-soft border-b border-line">
            <th className="px-5 py-3.5 font-semibold">Name</th>
            <th className="px-5 py-3.5 font-semibold">Event</th>
            <th className="px-5 py-3.5 font-semibold">Resident</th>
            <th className="px-5 py-3.5 font-semibold">Due</th>
            <th className="px-5 py-3.5 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {regs.map((r) => (
            <tr key={r.id} className="border-b border-line last:border-0 hover:bg-mist/60">
              <td className="px-5 py-3.5">
                <p className="font-medium">{r.name}</p>
                <p className="text-[12px] text-ink-soft">{r.email} · {r.phone}</p>
              </td>
              <td className="px-5 py-3.5">{evs.find((e) => e.id === r.eventId)?.title ?? "—"}</td>
              <td className="px-5 py-3.5">{r.isResident ? `Yes (−${r.discountPct}%)` : "No"}</td>
              <td className="px-5 py-3.5">{r.amountDuePkr > 0 ? pkr(r.amountDuePkr) : "Free"}</td>
              <td className="px-5 py-3.5">
                <AdminBadge tone={r.status === "CONFIRMED" ? "dark" : "neutral"}>{r.status.replace(/_/g, " ")}</AdminBadge>
              </td>
            </tr>
          ))}
          {regs.length === 0 && (
            <tr><td colSpan={5} className="px-5 py-10 text-center text-ink-soft">No registrations yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export const dynamic = "force-dynamic";
