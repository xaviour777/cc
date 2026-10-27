export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const pkr = (n: number) => `PKR ${n.toLocaleString("en-PK")}`;

export function todayISO(): string {
  const d = new Date();
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn + "T00:00:00Z").getTime();
  const b = new Date(checkOut + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86400000);
}

export function isISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

export function formatDate(isoOrDate: string | Date | null | undefined): string {
  if (!isoOrDate) return "To be announced";
  const d =
    typeof isoOrDate === "string"
      ? new Date(
          isoOrDate.length === 10 ? isoOrDate + "T00:00:00" : isoOrDate
        )
      : isoOrDate;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return "TBA";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function genReference(prefix = "CC"): string {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 5; i++)
    out += abc[Math.floor(Math.random() * abc.length)];
  const d = new Date();
  return `${prefix}-${String(d.getFullYear()).slice(2)}${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${out}`;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function maskIdNumber(id: string): string {
  const digits = id.replace(/\D/g, "");
  return digits.slice(-4);
}
