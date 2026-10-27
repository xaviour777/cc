import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, auditLogs } from "@/db/schema";

const COOKIE = "cc_session";
const SESSION_DAYS = 7;

// ---------- Passwords (scrypt) ----------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64);
  const real = Buffer.from(hash, "hex");
  return test.length === real.length && crypto.timingSafeEqual(test, real);
}

// ---------- TOTP (RFC 6238, SHA-1, 30s step) — used for admin MFA ----------
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function totpGenerateSecret(): string {
  const bytes = crypto.randomBytes(20);
  let out = "";
  for (const b of bytes) out += B32[b % 32];
  return out;
}

function base32Decode(s: string): Buffer {
  const clean = s.toUpperCase().replace(/[^A-Z2-7]/g, "");
  const bits = clean
    .split("")
    .map((c) => B32.indexOf(c).toString(2).padStart(5, "0"))
    .join("");
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8)
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export function totpCode(secret: string, atTimeMs = Date.now()): string {
  const counter = Math.floor(atTimeMs / 1000 / 30);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto
    .createHmac("sha1", base32Decode(secret))
    .update(buf)
    .digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return String(code % 1_000_000).padStart(6, "0");
}

export function totpVerify(secret: string, code: string): boolean {
  const clean = code.replace(/\s/g, "");
  for (const w of [-1, 0, 1]) {
    if (totpCode(secret, Date.now() + w * 30_000) === clean) return true;
  }
  return false;
}

export function otpauthUrl(secret: string, email: string): string {
  return `otpauth://totp/ContentColony:${encodeURIComponent(
    email
  )}?secret=${secret}&issuer=ContentColony`;
}

// ---------- Sessions ----------
export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.insert(sessions).values({ id: token, userId, expiresAt: expires });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, token));
  jar.delete(COOKIE);
}

export async function getSessionUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, token), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0]?.user ?? null;
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/admin/login");
  return user;
}

export async function logAction(
  userId: number | null,
  action: string,
  entity: string,
  entityId?: string | number | null,
  meta?: Record<string, unknown>
) {
  await db.insert(auditLogs).values({
    userId,
    action,
    entity,
    entityId: entityId != null ? String(entityId) : null,
    meta: meta ?? null,
  });
}

// ---------- Best-effort login rate limiting (per instance) ----------
const attempts = new Map<string, { count: number; resetAt: number }>();
export function loginAllowed(key: string): boolean {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || rec.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + 10 * 60_000 });
    return true;
  }
  rec.count += 1;
  return rec.count <= 8;
}
