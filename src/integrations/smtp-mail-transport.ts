import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export type MailSendInput = {
  from: string;
  to: string;
  subject: string;
  text: string;
};

export type MailSendResult = {
  messageId: string;
};

/** Abstraktion fuer Mahn-E-Mail-Versand (Tests injizieren Mock). */
export interface MailTransportPort {
  isConfigured(): boolean;
  send(input: MailSendInput): Promise<MailSendResult>;
}

class UnconfiguredMailTransport implements MailTransportPort {
  public isConfigured(): boolean {
    return false;
  }

  public async send(_input: MailSendInput): Promise<MailSendResult> {
    throw new Error("SMTP nicht konfiguriert");
  }
}

class NodemailerSmtpTransport implements MailTransportPort {
  private readonly transporter: Transporter;
  private readonly defaultFrom: string;

  public constructor(transporter: Transporter, defaultFrom: string) {
    this.transporter = transporter;
    this.defaultFrom = defaultFrom;
  }

  public isConfigured(): boolean {
    return true;
  }

  public async send(input: MailSendInput): Promise<MailSendResult> {
    const info = await this.transporter.sendMail({
      from: input.from || this.defaultFrom,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    const messageId =
      typeof info.messageId === "string" && info.messageId.trim().length > 0 ? info.messageId.trim() : "unknown";
    return { messageId };
  }
}

/**
 * Liest `ERP_SMTP_HOST`, optional Port/User/Pass/From.
 * Ohne Host: Transport meldet `isConfigured() === false`.
 */
export function createSmtpMailTransportFromEnv(): MailTransportPort {
  const host = (process.env.ERP_SMTP_HOST ?? "").trim();
  if (!host) {
    return new UnconfiguredMailTransport();
  }
  const port = Number.parseInt(process.env.ERP_SMTP_PORT ?? "587", 10);
  const secure = (process.env.ERP_SMTP_SECURE ?? "").trim() === "1";
  const user = (process.env.ERP_SMTP_USER ?? "").trim();
  const pass = (process.env.ERP_SMTP_PASS ?? "").trim();
  const defaultFrom = (process.env.ERP_SMTP_FROM ?? (user || "noreply@localhost")).trim();

  const transporter = nodemailer.createTransport({
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
    auth: user ? { user, pass } : undefined,
  });
  return new NodemailerSmtpTransport(transporter, defaultFrom);
}
