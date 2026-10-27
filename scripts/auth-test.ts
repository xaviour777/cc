import { config } from "dotenv";
config();
import { eq } from "drizzle-orm";
async function main() {
  const { db } = await import("../src/db");
  const { users } = await import("../src/db/schema");
  const { verifyPassword, totpGenerateSecret, totpCode, totpVerify } = await import("../src/lib/auth");
  const [admin] = await db.select().from(users).where(eq(users.email, "admin@contentcolony.pk"));
  console.log("admin exists:", Boolean(admin));
  console.log("correct password verifies:", verifyPassword("colony-admin-2025", admin.passwordHash));
  console.log("wrong password rejected:", !verifyPassword("nope", admin.passwordHash));
  const secret = totpGenerateSecret();
  const code = totpCode(secret);
  const wrong = code === "000000" ? "111111" : "000000";
  console.log("totp roundtrip verifies:", totpVerify(secret, code), "| bad code rejected:", !totpVerify(secret, wrong));
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
