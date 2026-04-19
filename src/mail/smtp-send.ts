import nodemailer from "nodemailer";

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim());
}

export function isPublicAppBaseUrlConfigured(): boolean {
  return Boolean(process.env.ERP_PUBLIC_APP_BASE_URL?.trim());
}

/**
 * Sendet eine einfache Text-E-Mail (Passwort-Reset u. Ä.).
 * Ohne SMTP in nicht-Produktion: nur Konsolen-Hinweis (kein Versand).
 */
export async function sendSmtpMail(options: { to: string; subject: string; text: string }): Promise<void> {
  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP_HOST is not set");
    }
    console.warn(
      "[erp] SMTP nicht konfiguriert — E-Mail würde an %s gehen (Betreff: %s)\n%s",
      options.to,
      options.subject,
      options.text,
    );
    return;
  }

  const host = process.env.SMTP_HOST!.trim();
  const port = parseInt(process.env.SMTP_PORT?.trim() || "587", 10);
  const secure = process.env.SMTP_SECURE === "1" || process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = (process.env.ERP_MAIL_FROM ?? user ?? "noreply@localhost").trim();

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass: pass ?? "" } : undefined,
  });

  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
  });
}
