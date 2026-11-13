import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { passes } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { readKycFile } from "@/lib/kyc-storage";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = Number((await params).id);
  const [p] = await db.select().from(passes).where(eq(passes.id, id)).limit(1);
  if (!p?.kycFilePath) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const buf = await readKycFile(p.kycFilePath);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": p.kycMime ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${(p.kycFileName ?? "id").replace(/"/g, "")}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File unavailable" }, { status: 404 });
  }
}
