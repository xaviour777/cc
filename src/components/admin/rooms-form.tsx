"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { addInventoryBlock } from "@/app/admin/actions";
import { todayISO, nightsBetween } from "@/lib/utils";

export function AddBlockForm({
  roomOptions,
  bedOptions,
}: {
  roomOptions: { id: number; label: string }[];
  bedOptions: { id: number; label: string }[];
}) {
  const [unit, setUnit] = useState("");
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const [kind, idStr] = unit.split(":");
      const res = await addInventoryBlock(
        kind === "bed" ? { bedId: Number(idStr) } : { roomId: Number(idStr) },
        startDate,
        endDate,
        reason
      );
      if (!res.ok) {
        setError(res.error ?? "Failed");
        return;
      }
      setReason("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const valid = unit && nightsBetween(startDate, endDate) >= 1;

  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <p className="font-semibold text-sm">Block inventory (maintenance / hold)</p>
      <p className="text-[12px] text-ink-soft mt-1">Blocked units instantly disappear from guest availability.</p>
      <div className="grid sm:grid-cols-[1fr_150px_150px_1fr_auto] gap-2 mt-4 items-end">
        <div>
          <label className="label">Unit</label>
          <select className="field !py-2.5 text-sm" value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="">Choose…</option>
            <optgroup label="Rooms">
              {roomOptions.map((r) => (
                <option key={r.id} value={`room:${r.id}`}>{r.label}</option>
              ))}
            </optgroup>
            <optgroup label="Beds">
              {bedOptions.map((b) => (
                <option key={b.id} value={`bed:${b.id}`}>{b.label}</option>
              ))}
            </optgroup>
          </select>
        </div>
        <div>
          <label className="label">From</label>
          <input type="date" className="field !py-2.5 text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="label">Until</label>
          <input type="date" className="field !py-2.5 text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div>
          <label className="label">Reason</label>
          <input className="field !py-2.5 text-sm" placeholder="e.g. AC repair" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <button onClick={submit} disabled={busy || !valid} className="btn btn-primary !py-2.5 !px-4 text-sm">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Block</>}
        </button>
      </div>
      {error && <p className="text-sm mt-2 font-medium">{error}</p>}
    </div>
  );
}
