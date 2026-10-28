"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  adminCreateBooking,
  assignBed,
  cancelBooking,
  checkInGuest,
  checkOutGuest,
  setComplianceFlag,
  setCustomPrice,
} from "@/app/admin/actions";
import { ActionButton } from "@/components/admin/form-shell";
import { addDaysISO, todayISO } from "@/lib/utils";

export function ManualBookingForm() {
  const [f, setF] = useState({
    accommodationKey: "SHARED_BUNK" as "SHARED_BUNK" | "PRIVATE_ROOM",
    checkIn: addDaysISO(todayISO(), 1),
    checkOut: addDaysISO(todayISO(), 4),
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    guestsCount: 1,
    paymentMethod: "BANK_TRANSFER" as const,
    overrideMinStay: false,
    overrideReason: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRef, setCreatedRef] = useState<string | null>(null);
  const router = useRouter();

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await adminCreateBooking(f);
      if (!res.ok) {
        setError(res.error ?? "Failed");
        return;
      }
      setCreatedRef(res.reference ?? null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <p className="font-semibold text-sm">New manual booking</p>
      {createdRef && (
        <p className="mt-2 text-sm bg-mist rounded-xl px-4 py-3">
          Created <b className="font-mono">{createdRef}</b> — find it in the list below.
        </p>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <div>
          <label className="label">Type</label>
          <select className="field" value={f.accommodationKey} onChange={(e) => setF({ ...f, accommodationKey: e.target.value as typeof f.accommodationKey })}>
            <option value="SHARED_BUNK">Shared bunk</option>
            <option value="PRIVATE_ROOM">Private room</option>
          </select>
        </div>
        <div>
          <label className="label">Check-in</label>
          <input type="date" className="field" value={f.checkIn} onChange={(e) => setF({ ...f, checkIn: e.target.value })} />
        </div>
        <div>
          <label className="label">Check-out</label>
          <input type="date" className="field" value={f.checkOut} onChange={(e) => setF({ ...f, checkOut: e.target.value })} />
        </div>
        <div>
          <label className="label">Payment method</label>
          <select className="field" value={f.paymentMethod} onChange={(e) => setF({ ...f, paymentMethod: e.target.value as typeof f.paymentMethod })}>
            <option value="BANK_TRANSFER">Bank transfer</option>
            <option value="RAAST">Raast</option>
            <option value="CARD_LINK">Card link</option>
            <option value="CASH_ON_ARRIVAL">Cash on arrival</option>
          </select>
        </div>
        <div>
          <label className="label">Guest name</label>
          <input className="field" value={f.guestName} onChange={(e) => setF({ ...f, guestName: e.target.value })} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="field" type="email" value={f.guestEmail} onChange={(e) => setF({ ...f, guestEmail: e.target.value })} />
        </div>
        <div>
          <label className="label">WhatsApp</label>
          <input className="field" value={f.guestPhone} onChange={(e) => setF({ ...f, guestPhone: e.target.value })} />
        </div>
        <div>
          <label className="label">Guests</label>
          <input className="field" type="number" min={1} max={4} value={f.guestsCount} onChange={(e) => setF({ ...f, guestsCount: Number(e.target.value) })} />
        </div>
      </div>
      <label className="flex items-center gap-2 mt-3 text-sm text-ink-soft">
        <input type="checkbox" className="accent-black" checked={f.overrideMinStay} onChange={(e) => setF({ ...f, overrideMinStay: e.target.checked })} />
        Override the 3-night minimum (exceptional, recorded)
      </label>
      {f.overrideMinStay && (
        <input className="field mt-2" placeholder="Override reason (required, saved to audit log)" value={f.overrideReason} onChange={(e) => setF({ ...f, overrideReason: e.target.value })} />
      )}
      <button onClick={submit} disabled={busy} className="btn btn-primary !py-2.5 !px-6 text-sm mt-4">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <>Create booking <ArrowRight size={14} /></>}
      </button>
      {error && <p className="text-sm mt-2 font-medium">{error}</p>}
    </div>
  );
}

export function AssignUnitSelect({
  bookingId,
  currentBedId,
  currentRoomId,
  options,
}: {
  bookingId: number;
  currentBedId: number | null;
  currentRoomId: number | null;
  options: { value: string; label: string }[];
}) {
  const [val, setVal] = useState(
    currentBedId ? `bed:${currentBedId}` : currentRoomId ? `room:${currentRoomId}` : ""
  );
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const change = async (v: string) => {
    setVal(v);
    setBusy(true);
    try {
      const [kind, idStr] = v.split(":");
      const id = Number(idStr);
      const res = await assignBed(bookingId, kind === "bed" ? id : null, kind === "room" ? id : null);
      if (!res.ok) window.alert(res.error ?? "Failed");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select className="field !py-2 text-sm" value={val} onChange={(e) => change(e.target.value)} disabled={busy}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {busy && <Loader2 size={14} className="animate-spin" />}
    </div>
  );
}

export function BookingOps({
  bookingId,
  status,
  complianceHotelEye,
  complianceTempResident,
}: {
  bookingId: number;
  status: string;
  complianceHotelEye: boolean;
  complianceTempResident: boolean;
}) {
  const router = useRouter();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {status === "CONFIRMED" && (
          <ActionButton
            variant="primary"
            action={async () => {
              const notes = window.prompt("Check-in notes (optional)") ?? "";
              return checkInGuest(bookingId, notes);
            }}
          >
            Check in guest
          </ActionButton>
        )}
        {status === "CHECKED_IN" && (
          <ActionButton
            variant="primary"
            action={async () => {
              const notes = window.prompt("Check-out notes (optional)") ?? "";
              return checkOutGuest(bookingId, notes);
            }}
          >
            Check out guest
          </ActionButton>
        )}
        {["PENDING_PAYMENT", "CONFIRMED"].includes(status) && (
          <ActionButton
            variant="danger"
            confirm="Cancel this booking? The bed/room is released immediately."
            action={async () => {
              const reason = window.prompt("Reason for cancellation (recorded in audit log)") ?? "";
              if (!reason.trim()) return { ok: false, error: "Reason required" };
              return cancelBooking(bookingId, reason);
            }}
          >
            Cancel booking
          </ActionButton>
        )}
      </div>
      <div className="rounded-xl border border-line p-4 space-y-2">
        <p className="text-[11px] tracking-[0.14em] uppercase font-semibold text-ink-soft">
          Punjab compliance checklist (manual workflow)
        </p>
        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            className="accent-black"
            checked={complianceHotelEye}
            onChange={async (e) => {
              await setComplianceFlag(bookingId, "hotelEye", e.target.checked);
              router.refresh();
            }}
          />
          Hotel Eye guest report submitted (manual)
        </label>
        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            className="accent-black"
            checked={complianceTempResident}
            onChange={async (e) => {
              await setComplianceFlag(bookingId, "tempResident", e.target.checked);
              router.refresh();
            }}
          />
          Temporary-resident information form completed
        </label>
        <p className="text-[11.5px] text-ink-soft leading-relaxed">
          Direct government submission is pending official authorization — track completion here.
        </p>
      </div>
    </div>
  );
}

export function CustomPriceForm({
  bookingId,
  pricePending,
  currentTotal,
  guestPhone,
  reference,
}: {
  bookingId: number;
  pricePending: boolean;
  currentTotal: number;
  guestPhone: string;
  reference: string;
}) {
  const [amount, setAmount] = useState(pricePending ? "" : String(currentTotal));
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  const phone = guestPhone.replace(/\D/g, "").replace(/^0/, "92");

  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <p className="font-semibold text-sm">
        {pricePending ? "Set the agreed price" : "Change price (custom offer)"}
      </p>
      <p className="text-[12px] text-ink-soft mt-1">
        Agree the price with the guest on WhatsApp, then save it here. The guest sees it on
        their booking page and can pay.
      </p>
      <a
        href={`https://wa.me/${phone}?text=${encodeURIComponent(`Assalam-o-alaikum! About your Content Colony booking ${reference}:`)}`}
        target="_blank"
        rel="noreferrer"
        className="btn btn-outline !py-2 !px-4 text-sm mt-3"
      >
        Chat with guest on WhatsApp
      </a>
      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <div>
          <label className="label">Total price (PKR)</label>
          <input type="number" min={1} className="field" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 90000" />
        </div>
        <div>
          <label className="label">Label (optional)</label>
          <input className="field" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. November special offer" />
        </div>
      </div>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setMsg(null);
          try {
            const res = await setCustomPrice(bookingId, Number(amount), label);
            setMsg(res.ok ? "Price saved" : res.error ?? "Failed");
            if (res.ok) router.refresh();
          } finally {
            setBusy(false);
          }
        }}
        className="btn btn-primary !py-2.5 !px-6 text-sm mt-3"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : null} Save price
      </button>
      {msg && <p className="text-sm mt-2">{msg}</p>}
    </div>
  );
}
