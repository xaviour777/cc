"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  FileText,
  Loader2,
  ShieldCheck,
  Upload,
} from "lucide-react";
import {
  bookStudioSlot,
  signStayAgreement,
  uploadKyc,
} from "@/lib/actions";
import { STUDIO_SLOTS } from "@/lib/studio";
import { cx, formatDate } from "@/lib/utils";

// ---------- Email gate ----------
export function PortalVerify({ reference }: { reference: string }) {
  const [email, setEmail] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="rounded-3xl border border-line bg-paper p-8 md:p-12 max-w-lg mx-auto text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-mist flex items-center justify-center">
        <ShieldCheck size={20} />
      </div>
      <h2 className="display-md mt-5">Verify it&apos;s you.</h2>
      <p className="text-ink-soft text-sm mt-3 leading-relaxed">
        Booking <span className="font-semibold text-ink">{reference}</span> — enter
        the email you booked with to open your portal.
      </p>
      <div className="flex gap-2 mt-6">
        <input
          className="field flex-1"
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && start(() => router.push(`/booking/${reference}?email=${encodeURIComponent(email)}`))}
        />
        <button
          className="btn btn-primary !px-5"
          disabled={pending}
          onClick={() => start(() => router.push(`/booking/${reference}?email=${encodeURIComponent(email)}`))}
        >
          {pending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
}

// ---------- KYC upload ----------
export function KycUpload({
  reference,
  email,
  docs,
}: {
  reference: string;
  email: string;
  docs: { id: number; docType: string; status: string; fileName: string; reviewNote: string | null }[];
}) {
  const [docType, setDocType] = useState("CNIC");
  const [idNumber, setIdNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = async () => {
    if (!file) {
      setError("Attach a photo or scan of the document.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("reference", reference);
      fd.set("email", email);
      fd.set("docType", docType);
      fd.set("idNumber", idNumber);
      fd.set("file", file);
      const res = await uploadKyc(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl border border-line bg-paper p-6 md:p-7">
      <div className="flex items-center gap-3">
        <ShieldCheck size={20} />
        <h3 className="font-display font-bold text-xl tracking-tight">Identity verification</h3>
      </div>
      <p className="text-sm text-ink-soft mt-2 leading-relaxed">
        A legal requirement for all overnight guests: upload your CNIC, NICOP or
        passport. Files are stored privately and visible only to authorized
        administration — never synced to marketing tools.
      </p>

      {docs.length > 0 && (
        <ul className="mt-4 space-y-2">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 rounded-xl bg-mist px-4 py-3 text-sm">
              <span className="font-medium">
                {d.docType} · {d.fileName}
              </span>
              <span
                className={cx(
                  "text-[11px] tracking-[0.12em] uppercase font-semibold px-2.5 py-1 rounded-full",
                  d.status === "APPROVED" && "bg-ink text-paper",
                  d.status === "PENDING" && "bg-line text-ink",
                  d.status === "REJECTED" && "bg-ink/10"
                )}
              >
                {d.status === "REJECTED" && d.reviewNote ? `Rejected — ${d.reviewNote}` : d.status}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="grid sm:grid-cols-2 gap-3 mt-5">
        <div>
          <label className="label">Document type</label>
          <select className="field" value={docType} onChange={(e) => setDocType(e.target.value)}>
            <option value="CNIC">CNIC</option>
            <option value="NICOP">NICOP</option>
            <option value="PASSPORT">Passport</option>
          </select>
        </div>
        <div>
          <label className="label">ID number</label>
          <input className="field" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="xxxxx-xxxxxxx-x" />
        </div>
      </div>
      <label className="mt-3 flex items-center justify-center gap-2.5 rounded-2xl border border-dashed border-line bg-mist p-6 cursor-pointer hover:border-ink transition-colors text-sm text-ink-soft">
        <Upload size={16} />
        {file ? file.name : "Choose a JPG, PNG, WEBP or PDF (max 8 MB)"}
        <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
      <button onClick={submit} disabled={busy} className="btn btn-primary w-full mt-3">
        {busy ? <Loader2 size={16} className="animate-spin" /> : "Upload securely"}
      </button>
      {error && <p className="text-sm mt-2 font-medium">{error}</p>}
    </div>
  );
}

// ---------- Agreement ----------
export function AgreementSigner({
  reference,
  email,
  templateText,
  signed,
}: {
  reference: string;
  email: string;
  templateText: string | null;
  signed: { version: number; at: Date } | null;
}) {
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await signStayAgreement({ reference, email, signerName: name, consent });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  if (signed)
    return (
      <div className="rounded-3xl border border-line bg-paper p-6 md:p-7">
        <div className="flex items-center gap-3">
          <FileText size={20} />
          <h3 className="font-display font-bold text-xl tracking-tight">Stay agreement</h3>
        </div>
        <div className="mt-4 rounded-2xl bg-mist p-5 flex items-center gap-3">
          <BadgeCheck size={18} />
          <p className="text-sm font-medium">
            Signed (v{signed.version}) on {formatDate(signed.at)} — your copy is kept here and in admin.
          </p>
        </div>
      </div>
    );

  return (
    <div className="rounded-3xl border border-line bg-paper p-6 md:p-7">
      <div className="flex items-center gap-3">
        <FileText size={20} />
        <h3 className="font-display font-bold text-xl tracking-tight">Stay agreement</h3>
      </div>
      <div className="mt-4 rounded-2xl bg-mist p-5 max-h-64 overflow-y-auto">
        <pre className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink-soft font-sans">
          {templateText ?? "No template configured yet — the team will send yours shortly."}
        </pre>
      </div>
      <div className="mt-4">
        <label className="label">Type your full legal name to sign</label>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="As on your ID" />
      </div>
      <label className="flex items-start gap-2.5 mt-3 text-sm text-ink-soft cursor-pointer">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 accent-black" />
        I have read and agree to the stay agreement above. I understand my typed
        name, a timestamp and this agreement version are stored as my signature.
      </label>
      <button onClick={submit} disabled={busy || !templateText} className="btn btn-primary w-full mt-4">
        {busy ? <Loader2 size={16} className="animate-spin" /> : "Sign agreement"}
      </button>
      {error && <p className="text-sm mt-2 font-medium">{error}</p>}
    </div>
  );
}

// ---------- Studio / call pod ----------
export function StudioBooker({
  reference,
  email,
  checkIn,
  checkOut,
  slots,
}: {
  reference: string;
  email: string;
  checkIn: string;
  checkOut: string;
  slots: { id: number; resource: string; date: string; slot: string; status: string }[];
}) {
  const [resource, setResource] = useState<"STUDIO" | "CALL_POD">("STUDIO");
  const [date, setDate] = useState(checkIn);
  const [slot, setSlot] = useState(STUDIO_SLOTS[0]);
  const [purpose, setPurpose] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = async () => {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await bookStudioSlot({ reference, email, resource, date, slot, purpose });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMsg("Slot locked in. See you on set.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl border border-line bg-paper p-6 md:p-7">
      <div className="flex items-center gap-3">
        <Camera size={20} />
        <h3 className="font-display font-bold text-xl tracking-tight">Studio & call pod</h3>
      </div>
      <p className="text-sm text-ink-soft mt-2 leading-relaxed">
        Included in your stay — reserve 2-hour slots inside your dates.
      </p>

      {slots.length > 0 && (
        <ul className="mt-4 space-y-2">
          {slots.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-mist px-4 py-3 text-sm">
              <span className="font-medium">
                {s.resource === "STUDIO" ? "Studio" : "Call pod"} · {formatDate(s.date)}
              </span>
              <span className="text-ink-soft">{s.slot}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-2 gap-3 mt-5">
        <div>
          <label className="label">Space</label>
          <select className="field" value={resource} onChange={(e) => setResource(e.target.value as "STUDIO" | "CALL_POD")}>
            <option value="STUDIO">Production studio</option>
            <option value="CALL_POD">Call pod</option>
          </select>
        </div>
        <div>
          <label className="label">Date</label>
          <input className="field" type="date" min={checkIn} max={checkOut} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <div className="mt-3">
        <label className="label">Slot</label>
        <div className="flex flex-wrap gap-2">
          {STUDIO_SLOTS.map((s) => (
            <button
              key={s}
              onClick={() => setSlot(s)}
              className={cx(
                "text-[12.5px] px-3.5 py-2 rounded-full border transition-colors",
                slot === s ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3">
        <label className="label">What are you making? (optional)</label>
        <input className="field" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Podcast ep. 3, product shoot…" />
      </div>
      <button onClick={submit} disabled={busy} className="btn btn-primary w-full mt-4">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <>Reserve the slot <Check size={15} /></>}
      </button>
      {msg && <p className="text-sm mt-2 font-medium flex items-center gap-1.5"><Check size={14} /> {msg}</p>}
      {error && <p className="text-sm mt-2 font-medium">{error}</p>}
    </div>
  );
}
