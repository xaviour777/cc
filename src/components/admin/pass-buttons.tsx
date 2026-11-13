"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ActionButton } from "@/components/admin/form-shell";
import { adminUploadPassKyc, cancelPass, checkInPass, confirmPass } from "@/app/admin/pass-actions";
import { shrinkImage } from "@/components/booking/portal-client";

const METHODS = { "1": "CASH_ON_ARRIVAL", "2": "BANK_TRANSFER", "3": "RAAST", "4": "CARD_LINK" } as const;

export function ConfirmPassButton({ id, amount }: { id: number; amount: number }) {
  return (
    <ActionButton
      variant="primary"
      action={async () => {
        const paid = window.prompt("Payment received (PKR). Enter 0 if free.", String(amount || ""));
        if (paid === null) return { ok: true };
        let method: (typeof METHODS)[keyof typeof METHODS] = "CASH_ON_ARRIVAL";
        if (Number(paid) > 0) {
          const m = window.prompt("Paid how? 1 = Cash, 2 = Bank transfer, 3 = Raast / JazzCash / Easypaisa, 4 = Card", "1");
          if (m === null) return { ok: true };
          method = METHODS[(m.trim() as keyof typeof METHODS)] ?? "CASH_ON_ARRIVAL";
        }
        return confirmPass(id, Number(paid) || 0, method);
      }}
    >
      Confirm + payment
    </ActionButton>
  );
}

export function CheckInPassButton({ id }: { id: number }) {
  return (
    <ActionButton variant="primary" action={() => checkInPass(id)}>
      Check in
    </ActionButton>
  );
}

export function CancelPassButton({ id }: { id: number }) {
  return (
    <ActionButton
      variant="danger"
      action={async () => {
        const reason = window.prompt("Why is this cancelled? (e.g. no answer, changed plans)");
        if (reason === null) return { ok: true };
        return cancelPass(id, reason);
      }}
    >
      Cancel
    </ActionButton>
  );
}

export function AddPassIdButton({ id }: { id: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          try {
            const fd = new FormData();
            fd.set("id", String(id));
            fd.set("docType", "CNIC");
            fd.set("file", await shrinkImage(file));
            const res = await adminUploadPassKyc(fd);
            if (!res.ok) window.alert(res.error);
            router.refresh();
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium border border-line hover:border-ink"
      >
        {busy && <Loader2 size={12} className="animate-spin" />} Add ID
      </button>
    </>
  );
}
