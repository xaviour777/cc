"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { uploadPassKyc } from "@/lib/pass-actions";
import { shrinkImage } from "@/components/booking/portal-client";

export default function PassKycUpload({
  reference,
  email,
  uploaded,
}: {
  reference: string;
  email: string;
  uploaded: { docType: string; fileName: string } | null;
}) {
  const [docType, setDocType] = useState("CNIC");
  const [idNumber, setIdNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replace, setReplace] = useState(false);
  const router = useRouter();

  const submit = async () => {
    if (!file) return setError("Attach a photo or scan of the document.");
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("reference", reference);
      fd.set("email", email);
      fd.set("docType", docType);
      fd.set("idNumber", idNumber);
      fd.set("file", await shrinkImage(file));
      const res = await uploadPassKyc(fd);
      if (!res.ok) return setError(res.error);
      setFile(null);
      setReplace(false);
      router.refresh();
    } catch {
      setError("Upload failed. Try a smaller photo (under 4 MB) or a PDF, and check your internet.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl border border-line bg-paper p-6 md:p-7">
      <div className="flex items-center gap-3">
        <ShieldCheck size={20} />
        <h2 className="font-display font-bold text-xl tracking-tight">Add your ID before you come</h2>
      </div>
      <p className="text-sm text-ink-soft mt-2 leading-relaxed">
        CNIC, NICOP, passport or B-Form (under 18). It is stored privately, only our admin team can see it,
        and it makes check-in at the door take a minute.
      </p>
      {uploaded && !replace ? (
        <div className="mt-4 rounded-xl bg-mist px-4 py-3 text-sm flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 font-medium"><Check size={15} /> {uploaded.docType} added · {uploaded.fileName}</span>
          <button className="text-[12.5px] underline underline-offset-2" onClick={() => setReplace(true)}>Replace</button>
        </div>
      ) : (
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Document</label>
            <select className="field" value={docType} onChange={(e) => setDocType(e.target.value)}>
              <option value="CNIC">CNIC</option>
              <option value="NICOP">NICOP</option>
              <option value="PASSPORT">Passport</option>
              <option value="B_FORM">B-Form</option>
            </select>
          </div>
          <div>
            <label className="label">ID number (optional)</label>
            <input className="field" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="35202-xxxxxxx-x" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Photo or scan</label>
            <input type="file" accept="image/*,application/pdf" className="field" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button onClick={submit} disabled={busy} className="btn btn-primary !py-2.5 !px-6 text-sm">
              {busy && <Loader2 size={15} className="animate-spin" />} Upload ID
            </button>
            {error && <p className="text-sm font-medium">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
