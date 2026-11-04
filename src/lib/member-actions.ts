"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession, hashPassword, loginAllowed, verifyPassword } from "@/lib/auth";
import { consumeAccountToken, createAccountLink } from "@/lib/members";
import { recordNotification } from "@/lib/ghl";

type R = { ok: boolean; error?: string };

export async function memberLogin(email: string, password: string): Promise<R> {
  const e = email.trim().toLowerCase();
  if (!loginAllowed(`member:${e}`)) return { ok: false, error: "Too many attempts. Wait 10 minutes." };
  const [u] = await db.select().from(users).where(eq(users.email, e)).limit(1);
  if (!u || u.role !== "USER" || !verifyPassword(password, u.passwordHash))
    return { ok: false, error: "Wrong email or password." };
  await createSession(u.id);
  return { ok: true };
}

export async function memberLogout(): Promise<R> {
  await destroySession();
  return { ok: true };
}

export async function setMemberPassword(token: string, password: string): Promise<R> {
  if (password.length < 8) return { ok: false, error: "Use at least 8 characters." };
  const userId = await consumeAccountToken(token);
  if (!userId) return { ok: false, error: "This link has expired or was already used. Ask us for a new one." };
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u || u.role !== "USER") return { ok: false, error: "Account not found." };
  await db.update(users).set({ passwordHash: hashPassword(password) }).where(eq(users.id, userId));
  await createSession(userId);
  return { ok: true };
}

export async function requestMemberLink(email: string): Promise<R> {
  const e = email.trim().toLowerCase();
  if (!loginAllowed(`member-link:${e}`)) return { ok: true };
  const [u] = await db.select().from(users).where(eq(users.email, e)).limit(1);
  // Same answer either way, so nobody can check which emails are members.
  if (!u || u.role !== "USER") return { ok: true };
  const link = await createAccountLink(u.id);
  await recordNotification({
    channel: "EMAIL",
    to: u.email,
    subject: "Set your Content Colony password",
    body: `Assalam-o-alaikum ${u.name}!\n\nOpen this link to set your password (valid for 7 days):\n${link}\n\nIf you didn't ask for this, ignore this email.`,
    entityType: "user",
    entityId: u.id,
    copyTeam: false,
  });
  return { ok: true };
}
