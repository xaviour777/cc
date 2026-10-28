import "server-only";
import fs from "fs/promises";
import path from "path";

// ID documents go to a private Supabase Storage bucket when SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are set (needed on Vercel, whose disk is not
// kept), otherwise to ./storage/kyc on the local disk.
const BUCKET = "kyc";
const PREFIX = "supabase:";
const LOCAL_DIR = path.join(process.cwd(), "storage", "kyc");

function supabase() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

/** Saves the file and returns the value to store in kyc_documents.file_path. */
export async function saveKycFile(name: string, mime: string, data: Buffer): Promise<string> {
  const sb = supabase();
  if (sb) {
    const res = await fetch(`${sb.url}/storage/v1/object/${BUCKET}/${name}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sb.key}`, apikey: sb.key, "Content-Type": mime },
      body: new Uint8Array(data),
    });
    if (!res.ok) throw new Error(`Storage upload failed (${res.status})`);
    return `${PREFIX}${name}`;
  }
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  const filePath = path.join(LOCAL_DIR, name);
  await fs.writeFile(filePath, data);
  return filePath;
}

export async function readKycFile(stored: string): Promise<Buffer> {
  if (!stored.startsWith(PREFIX)) return fs.readFile(stored);
  const sb = supabase();
  if (!sb) throw new Error("Supabase storage is not configured");
  const res = await fetch(`${sb.url}/storage/v1/object/${BUCKET}/${stored.slice(PREFIX.length)}`, {
    headers: { Authorization: `Bearer ${sb.key}`, apikey: sb.key },
  });
  if (!res.ok) throw new Error(`Storage download failed (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}
