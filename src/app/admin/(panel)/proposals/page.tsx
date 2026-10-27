import { desc } from "drizzle-orm";
import { db } from "@/db";
import { eventProposals } from "@/db/schema";
import { approveProposalToEvent, setProposalStatus } from "@/app/admin/actions";
import { formatDate } from "@/lib/utils";
import { ActionButton, AdminBadge } from "@/components/admin/form-shell";

export default async function ProposalsPage() {
  const rows = await db.select().from(eventProposals).orderBy(desc(eventProposals.createdAt));

  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl tracking-tight">Event Requests</h1>
      <p className="text-sm text-ink-soft mt-1">
        Proposals from external creators, trainers and brands. Approving one creates a private event draft — review and publish from Events.
      </p>

      <div className="mt-6 space-y-3">
        {rows.map((p) => (
          <div key={p.id} className="rounded-2xl border border-line bg-paper p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-base">{p.title}</p>
                <p className="text-[12.5px] text-ink-soft mt-0.5">
                  {p.category} · by {p.organizerName}
                  {p.brand ? ` (${p.brand})` : ""} · {p.email} · {p.whatsapp}
                </p>
                <p className="text-[12.5px] text-ink-soft mt-0.5">
                  {p.preferredDate ? `Wants ${formatDate(p.preferredDate)}` : "Flexible dates"}
                  {p.expectedAttendees ? ` · ~${p.expectedAttendees} attendees` : ""}
                  {p.ticketSuggestion ? ` · suggests "${p.ticketSuggestion}"` : ""}
                  {p.socialUrl ? (
                    <>
                      {" · "}
                      <a href={p.socialUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">social profile</a>
                    </>
                  ) : null}
                </p>
              </div>
              <AdminBadge tone={p.status === "NEW" ? "dark" : "neutral"}>{p.status}</AdminBadge>
            </div>
            <p className="text-sm text-ink-soft mt-3 leading-relaxed whitespace-pre-wrap">{p.description}</p>
            {p.speakerBio && <p className="text-[12.5px] text-ink-soft mt-2"><b>Speaker:</b> {p.speakerBio}</p>}
            {p.requirements && <p className="text-[12.5px] text-ink-soft mt-1"><b>Needs:</b> {p.requirements}</p>}
            {p.adminNote && <p className="text-[12.5px] mt-2 bg-mist rounded-lg px-3 py-2">Note: {p.adminNote}</p>}
            <div className="flex flex-wrap gap-2 mt-4">
              {p.status === "NEW" && (
                <ActionButton action={setProposalStatus.bind(null, p.id, "REVIEWED", "")}>Mark reviewed</ActionButton>
              )}
              {p.status !== "APPROVED" && (
                <ActionButton
                  variant="primary"
                  confirm="Approve and convert this into an event draft?"
                  action={async () => {
                    const res = await approveProposalToEvent(p.id);
                    if (res.ok && res.eventId) window.location.href = `/admin/events?edit=${res.eventId}`;
                    return res;
                  }}
                >
                  Approve → event draft
                </ActionButton>
              )}
              {p.status !== "REJECTED" && p.status !== "APPROVED" && (
                <ActionButton
                  variant="danger"
                  action={async () => {
                    const note = window.prompt("Reason / note for the organizer?") ?? "";
                    return setProposalStatus(p.id, "REJECTED", note);
                  }}
                >
                  Reject
                </ActionButton>
              )}
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="rounded-2xl border border-line bg-paper p-10 text-center text-ink-soft">
            No proposals yet — the Host an Event page is live.
          </div>
        )}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
