"use client";

// Buttons that need browser prompts or redirects. They live in a client file
// because server pages can't pass inline functions to client components.
import { approveProposalToEvent, checkInGuest, checkOutGuest, setProposalStatus } from "@/app/admin/actions";
import { ActionButton } from "@/components/admin/form-shell";

export function CheckInButton({ bookingId }: { bookingId: number }) {
  return (
    <ActionButton
      variant="primary"
      action={async () => {
        const notes = window.prompt("Check-in notes (optional)") ?? "";
        return checkInGuest(bookingId, notes);
      }}
    >
      Check in
    </ActionButton>
  );
}

export function CheckOutButton({ bookingId }: { bookingId: number }) {
  return (
    <ActionButton
      variant="primary"
      action={async () => {
        const notes = window.prompt("Check-out notes (optional)") ?? "";
        return checkOutGuest(bookingId, notes);
      }}
    >
      Check out
    </ActionButton>
  );
}

export function ApproveProposalButton({ proposalId }: { proposalId: number }) {
  return (
    <ActionButton
      variant="primary"
      confirm="Approve and convert this into an event draft?"
      action={async () => {
        const res = await approveProposalToEvent(proposalId);
        if (res.ok && res.eventId) window.location.href = `/admin/events?edit=${res.eventId}`;
        return res;
      }}
    >
      Approve → event draft
    </ActionButton>
  );
}

export function RejectProposalButton({ proposalId }: { proposalId: number }) {
  return (
    <ActionButton
      variant="danger"
      action={async () => {
        const note = window.prompt("Reason / note for the organizer?") ?? "";
        return setProposalStatus(proposalId, "REJECTED", note);
      }}
    >
      Reject
    </ActionButton>
  );
}
