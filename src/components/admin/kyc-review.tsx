"use client";

import { reviewKyc } from "@/app/admin/actions";
import { ActionButton } from "@/components/admin/form-shell";

export default function KycReviewButtons({ id }: { id: number }) {
  return (
    <div className="flex gap-1.5">
      <ActionButton variant="primary" action={reviewKyc.bind(null, id, "APPROVED", "")}>
        Approve
      </ActionButton>
      <ActionButton
        variant="danger"
        action={async () => {
          const note = window.prompt("Why is it rejected? (shown to the guest)") ?? "";
          if (!note.trim()) return { ok: false, error: "Add a note so the guest can fix it" };
          return reviewKyc(id, "REJECTED", note);
        }}
      >
        Reject
      </ActionButton>
    </div>
  );
}
