import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { kycDocuments } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { readKycFile } from "@/lib/kyc-storage";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = Number((await params).id);
  const [doc] = await db.select().from(kycDocuments).where(eq(kycDocuments.id, id)).limit(1);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const buf = await readKycFile(doc.filePath);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": doc.mime,
        "Content-Disposition": `inline; filename="${doc.fileName.replace(/"/g, "")}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File unavailable" }, { status: 404 });
  }
}
