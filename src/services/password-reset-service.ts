import { createHash, randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import { DomainError } from "../errors/domain-error.js";
import { sendSmtpMail, isPublicAppBaseUrlConfigured, isSmtpConfigured } from "../mail/smtp-send.js";
import type { AuditService } from "./audit-service.js";

const BCRYPT_COST = 12;
const RESET_TTL_MS = 60 * 60 * 1000;

export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
  ) {}

  /**
   * Erstellt Challenge und sendet E-Mail. Antwort-Envelope bleibt generisch (keine Enumeration).
   * Produktion: SMTP + ERP_PUBLIC_APP_BASE_URL erforderlich, sonst 503 vor Lookup.
   */
  async requestReset(tenantId: string, emailNorm: string): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      if (!isSmtpConfigured() || !isPublicAppBaseUrlConfigured()) {
        throw new DomainError(
          "PASSWORD_RESET_MAIL_NOT_CONFIGURED",
          "Passwort-Zurücksetzen per E-Mail ist nicht konfiguriert (SMTP / ERP_PUBLIC_APP_BASE_URL).",
          503,
        );
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { tenantId_emailNorm: { tenantId, emailNorm } },
    });
    if (!user?.active) {
      return;
    }

    await this.prisma.passwordResetChallenge.deleteMany({
      where: { tenantId, userId: user.id, usedAt: null },
    });

    const rawToken = randomBytes(48).toString("base64url");
    const tokenDigest = createHash("sha256").update(rawToken).digest("hex");
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + RESET_TTL_MS);

    await this.prisma.passwordResetChallenge.create({
      data: {
        id,
        tenantId,
        userId: user.id,
        tokenDigest,
        expiresAt,
      },
    });

    const base = (process.env.ERP_PUBLIC_APP_BASE_URL ?? "http://localhost:5173").trim().replace(/\/$/, "");
    const resetUrl = `${base}/#/password-reset?token=${encodeURIComponent(rawToken)}`;

    const text =
      `Sie haben ein neues Passwort für Ihr Konto angefordert.\n\n` +
      `Bitte öffnen Sie den folgenden Link (gültig ca. 1 Stunde). Wenn Sie nichts angefordert haben, ignorieren Sie diese E-Mail.\n\n` +
      `${resetUrl}\n`;

    await sendSmtpMail({
      to: user.emailNorm,
      subject: "Passwort zurücksetzen",
      text,
    });
  }

  async confirmReset(token: string, newPasswordPlain: string): Promise<void> {
    const tokenDigest = createHash("sha256").update(token).digest("hex");
    const row = await this.prisma.passwordResetChallenge.findUnique({
      where: { tokenDigest },
    });
    const now = new Date();
    if (!row || row.usedAt !== null || row.expiresAt <= now) {
      throw new DomainError("PASSWORD_RESET_INVALID", "Der Link ist ungültig oder abgelaufen.", 400);
    }

    const passwordHash = bcrypt.hashSync(newPasswordPlain, BCRYPT_COST);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { tenantId_id: { tenantId: row.tenantId, id: row.userId } },
        data: { passwordHash },
      }),
      this.prisma.passwordResetChallenge.update({
        where: { id: row.id },
        data: { usedAt: now },
      }),
    ]);

    await this.audit.append({
      id: randomUUID(),
      tenantId: row.tenantId,
      entityType: "USER",
      entityId: row.userId,
      action: "USER_UPDATED",
      timestamp: now,
      actorUserId: row.userId,
      reason: "Passwort per E-Mail-Reset-Link gesetzt",
      afterState: { passwordRotated: true },
    });
  }
}
