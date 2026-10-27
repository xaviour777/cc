import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, kycDocuments, signedAgreements } from "@/db/schema";
import { AdminBadge } from "@/components/admin/form-shell";
import KycReviewButtons from "@/components/admin/kyc-review";

export default async function KycPage() {
  const [docs, bks, signed] = await Promise.all([
    db.select().from(kycDocuments).orderBy(desc(kycDocuments.createdAt)),
    db.select().from(bookings),
    db.select().from(signedAgreements).orderBy(desc(signedAgreements.signedAt)),
  ]);
  const guestOf = (id: number) => bks.find((b) => b.id === id);

  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl tracking-tight">KYC & Agreements</h1>
      <p className="text-sm text-ink-soft mt-1">
        Identity documents are stored outside the public web root and only stream to authenticated admins here.
        They are never sent to GoHighLevel or marketing tools.
      </p>

      <h2 className="font-display font-bold text-xl tracking-tight mt-8">Identity documents</h2>
      <div className="mt-4 rounded-2xl border border-line bg-paper overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="text-left text-[11px] tracking-[0.12em] uppercase text-ink-soft border-b border-line">
              <th className="px-5 py-3.5 font-semibold">Guest</th>
              <th className="px-5 py-3.5 font-semibold">Doc</th>
              <th className="px-5 py-3.5 font-semibold">Uploaded</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5 font-semibold">File</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {docs.map((k) => {
              const b = guestOf(k.bookingId);
              return (
                <tr key={k.id} className="border-b border-line last:border-0 hover:bg-mist/60">
                  <td className="px-5 py-3.5">
                    {b ? (
                      <>
                        <p className="font-medium">{b.guestName}</p>
                        <Link href={`/admin/bookings/${b.id}`} className="text-[12px] text-ink-soft underline underline-offset-2 font-mono">
                          {b.reference}
                        </Link>
                      </>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3.5">{k.docType}{k.idNumberLast4 ? ` ····${k.idNumberLast4}` : ""}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">{k.createdAt.toLocaleDateString("en-GB")}</td>
                  <td className="px-5 py-3.5">
                    <AdminBadge tone={k.status === "APPROVED" ? "dark" : "neutral"}>
                      {k.status}{k.reviewNote ? `: ${k.reviewNote}` : ""}
                    </AdminBadge>
                  </td>
                  <td className="px-5 py-3.5">
                    <a href={`/api/kyc/${k.id}`} target="_blank" rel="noreferrer" className="text-[12.5px] font-medium underline underline-offset-2">
                      View securely
                    </a>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {k.status === "PENDING" && <KycReviewButtons id={k.id} />}
                  </td>
                </tr>
              );
            })}
            {docs.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-ink-soft">No documents uploaded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="font-display font-bold text-xl tracking-tight mt-10">Signed agreements</h2>
      <div className="mt-4 rounded-2xl border border-line bg-paper overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="text-left text-[11px] tracking-[0.12em] uppercase text-ink-soft border-b border-line">
              <th className="px-5 py-3.5 font-semibold">Booking</th>
              <th className="px-5 py-3.5 font-semibold">Signer</th>
              <th className="px-5 py-3.5 font-semibold">Version</th>
              <th className="px-5 py-3.5 font-semibold">Signed at</th>
              <th className="px-5 py-3.5 font-semibold">Document</th>
            </tr>
          </thead>
          <tbody>
            {signed.map((s) => {
              const b = guestOf(s.bookingId);
              return (
                <tr key={s.id} className="border-b border-line last:border-0 hover:bg-mist/60">
                  <td className="px-5 py-3.5">
                    {b && (
                      <Link href={`/admin/bookings/${b.id}`} className="font-mono text-[13px] underline underline-offset-2">
                        {b.reference}
                      </Link>
                    )}
                  </td>
                  <td className="px-5 py-3.5">{s.signerName}</td>
                  <td className="px-5 py-3.5">v{s.agreementVersion}</td>
                  <td className="px-5 py-3.5">{s.signedAt.toLocaleString("en-GB")}</td>
                  <td className="px-5 py-3.5">
                    <details>
                      <summary className="text-[12.5px] font-medium cursor-pointer underline underline-offset-2">Open snapshot</summary>
                      <div className="agreement-paper mt-3 p-4 max-w-2xl text-[12.5px]" dangerouslySetInnerHTML={{ __html: s.documentHtml }} />
                    </details>
                  </td>
                </tr>
              );
            })}
            {signed.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-ink-soft">No signed agreements yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
