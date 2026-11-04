"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { memberLinkForBooking } from "@/app/admin/actions";

export default function MemberLinkButton({
  bookingId,
  guestName,
  phone,
}: {
  bookingId: number;
  guestName: string;
  phone: string;
}) {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wa = phone.replace(/\D/g, "").replace(/^0/, "92");

  return (
    <div className="mt-3">
      {!url ? (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              const res = await memberLinkForBooking(bookingId);
              if (res.ok && res.url) setUrl(res.url);
              else setError(res.error ?? "Something went wrong");
            } finally {
              setBusy(false);
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium border border-line hover:border-ink disabled:opacity-50"
        >
          {busy && <Loader2 size={12} className="animate-spin" />}
          Create password link
        </button>
      ) : (
        <div className="rounded-xl bg-mist px-4 py-3 text-[12.5px]">
          <p className="text-ink-soft">One-time link, valid 7 days:</p>
          <p className="font-mono break-all mt-1 select-all">{url}</p>
          {wa && (
            <a
              href={`https://wa.me/${wa}?text=${encodeURIComponent(
                `Assalam-o-alaikum ${guestName}! Welcome to Content Colony. Set your member account password here: ${url}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary !py-2 !px-4 text-[12.5px] mt-2 inline-flex"
            >
              Send on WhatsApp
            </a>
          )}
        </div>
      )}
      {error && <p className="text-[12.5px] mt-2">{error}</p>}
    </div>
  );
}
