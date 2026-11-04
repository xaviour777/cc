import nodemailer from "nodemailer";

// Sends email through Google Workspace (or any SMTP server) when these env
// vars are set on Vercel:
//   SMTP_USER  the mailbox that signs in, e.g. hello@contentcolony.live
//   SMTP_PASS  a Google "App password" for that mailbox (16 letters)
//   SMTP_HOST  optional, default smtp.gmail.com
//   SMTP_PORT  optional, default 465
//   MAIL_FROM  optional, default "Content Colony <SMTP_USER>"
// Without them nothing is sent and messages stay queued in admin.

let transport: nodemailer.Transporter | null | undefined;

function getTransport() {
  if (transport !== undefined) return transport;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS?.replace(/\s/g, "");
  if (!user || !pass) return (transport = null);
  const port = Number(process.env.SMTP_PORT ?? 465);
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transport;
}

export function mailConfigured() {
  return Boolean(getTransport());
}

/** Returns true when the message was handed to the mail server. */
export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  const t = getTransport();
  if (!t) return false;
  try {
    await t.sendMail({
      from: process.env.MAIL_FROM ?? `Content Colony <${process.env.SMTP_USER}>`,
      replyTo: process.env.MAIL_REPLY_TO ?? process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    return true;
  } catch (e) {
    console.error("Email send failed:", (e as Error).message);
    return false;
  }
}
