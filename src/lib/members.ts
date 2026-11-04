import "server-only";
import crypto from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { accountTokens, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

// Members are users with role USER. They get an account once an admin
// confirms a payment, then set a password from a one-time link.

const LINK_DAYS = 7;

export function siteUrl() {
  return (process.env.SITE_URL ?? "https://contentcolony.live").replace(/\/$/, "");
}

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

/** Finds or creates the member account for an email. Never touches admin accounts. */
export async function ensureMemberAccount(input: { email: string; name: string; phone?: string | null }) {
  const email = input.email.trim().toLowerCase();
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) return { user: existing, isNew: false };
  const [created] = await db
    .insert(users)
    .values({
      email,
      name: input.name.trim() || email,
      phone: input.phone ?? null,
      role: "USER",
      // Not a valid "salt:hash" pair, so no password works until one is set.
      passwordHash: "!unset",
    })
    .returning();
  return { user: created, isNew: true };
}

export function hasPassword(passwordHash: string) {
  return passwordHash.includes(":");
}

/** Creates a one-time link that lets the member set (or reset) a password. */
export async function createAccountLink(userId: number) {
  const token = crypto.randomBytes(24).toString("hex");
  await db.insert(accountTokens).values({
    userId,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + LINK_DAYS * 86400000),
  });
  return `${siteUrl()}/account/set-password?token=${token}`;
}

export async function consumeAccountToken(token: string) {
  const [row] = await db
    .select()
    .from(accountTokens)
    .where(
      and(
        eq(accountTokens.tokenHash, sha256(token)),
        isNull(accountTokens.usedAt),
        gt(accountTokens.expiresAt, new Date())
      )
    )
    .limit(1);
  if (!row) return null;
  await db.update(accountTokens).set({ usedAt: new Date() }).where(eq(accountTokens.id, row.id));
  return row.userId;
}

export async function tokenIsValid(token: string) {
  const [row] = await db
    .select({ id: accountTokens.id })
    .from(accountTokens)
    .where(
      and(
        eq(accountTokens.tokenHash, sha256(token)),
        isNull(accountTokens.usedAt),
        gt(accountTokens.expiresAt, new Date())
      )
    )
    .limit(1);
  return Boolean(row);
}

/** The signed-in member, or null (admins are not members). */
export async function getMember() {
  const user = await getSessionUser();
  return user && user.role === "USER" ? user : null;
}
