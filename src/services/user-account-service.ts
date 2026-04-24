import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { UserRole } from "../domain/types.js";
import { DomainError } from "../errors/domain-error.js";
import type { AuditService } from "./audit-service.js";

const BCRYPT_COST = 12;

const ROLE_SET = new Set<UserRole>(["ADMIN", "BUCHHALTUNG", "GESCHAEFTSFUEHRUNG", "VERTRIEB_BAULEITUNG", "VIEWER"]);

function assertRole(value: string): UserRole {
  const normalized = value === "VERTRIEB" ? "VERTRIEB_BAULEITUNG" : value;
  if (!ROLE_SET.has(normalized as UserRole)) {
    throw new DomainError("VALIDATION_FAILED", `Ungültige Rolle: ${value}`, 400);
  }
  return normalized as UserRole;
}

export type TenantUserListItem = {
  id: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
};

export type CreateTenantUserInput = {
  emailNorm: string;
  passwordPlain: string;
  role: UserRole;
  reason: string;
};

export type PatchTenantUserInput = {
  role?: UserRole;
  active?: boolean;
  passwordPlain?: string;
  emailNorm?: string;
  reason: string;
};

export class UserAccountService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
  ) {}

  async listUsers(tenantId: string): Promise<{ users: TenantUserListItem[] }> {
    const rows = await this.prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
      select: { id: true, emailNorm: true, role: true, active: true, createdAt: true },
    });
    const users: TenantUserListItem[] = rows.map((r) => ({
      id: r.id,
      email: r.emailNorm,
      role: assertRole(r.role),
      active: r.active,
      createdAt: r.createdAt.toISOString(),
    }));
    return { users };
  }

  async createUser(tenantId: string, actorUserId: string, input: CreateTenantUserInput): Promise<TenantUserListItem> {
    const id = randomUUID();
    const passwordHash = bcrypt.hashSync(input.passwordPlain, BCRYPT_COST);
    try {
      await this.prisma.user.create({
        data: {
          tenantId,
          id,
          emailNorm: input.emailNorm,
          passwordHash,
          role: input.role,
          active: true,
          createdAt: new Date(),
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new DomainError("USER_EMAIL_CONFLICT", "E-Mail ist in diesem Mandanten bereits vergeben.", 409);
      }
      throw e;
    }
    await this.audit.append({
      id: randomUUID(),
      tenantId,
      entityType: "USER",
      entityId: id,
      action: "USER_CREATED",
      timestamp: new Date(),
      actorUserId,
      reason: input.reason,
      afterState: { emailNorm: input.emailNorm, role: input.role, active: true },
    });
    const row = await this.prisma.user.findUniqueOrThrow({
      where: { tenantId_id: { tenantId, id } },
      select: { id: true, emailNorm: true, role: true, active: true, createdAt: true },
    });
    return {
      id: row.id,
      email: row.emailNorm,
      role: assertRole(row.role),
      active: row.active,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async patchUser(
    tenantId: string,
    actorUserId: string,
    targetUserId: string,
    input: PatchTenantUserInput,
  ): Promise<TenantUserListItem> {
    const existing = await this.prisma.user.findUnique({
      where: { tenantId_id: { tenantId, id: targetUserId } },
    });
    if (!existing) {
      throw new DomainError("USER_NOT_FOUND", "Benutzer nicht gefunden.", 404);
    }

    if (input.active === false && targetUserId === actorUserId) {
      throw new DomainError("USER_SELF_DEACTIVATION_FORBIDDEN", "Sie können Ihr eigenes Konto nicht deaktivieren.", 409);
    }

    const beforeState = {
      emailNorm: existing.emailNorm,
      role: existing.role,
      active: existing.active,
    };

    if (input.role !== undefined && input.role !== "ADMIN" && existing.role === "ADMIN") {
      const otherActiveAdmins = await this.prisma.user.count({
        where: { tenantId, role: "ADMIN", active: true, id: { not: targetUserId } },
      });
      if (otherActiveAdmins === 0) {
        throw new DomainError(
          "USER_LAST_ADMIN_FORBIDDEN",
          "Der letzte aktive Administrator kann nicht herabgestuft werden.",
          409,
        );
      }
    }

    if (input.active === false && existing.role === "ADMIN" && existing.active) {
      const otherActiveAdmins = await this.prisma.user.count({
        where: { tenantId, role: "ADMIN", active: true, id: { not: targetUserId } },
      });
      if (otherActiveAdmins === 0) {
        throw new DomainError(
          "USER_LAST_ADMIN_FORBIDDEN",
          "Der letzte aktive Administrator kann nicht deaktiviert werden.",
          409,
        );
      }
    }

    const passwordHash =
      input.passwordPlain !== undefined ? bcrypt.hashSync(input.passwordPlain, BCRYPT_COST) : undefined;

    try {
      await this.prisma.user.update({
        where: { tenantId_id: { tenantId, id: targetUserId } },
        data: {
          ...(input.role !== undefined ? { role: input.role } : {}),
          ...(input.active !== undefined ? { active: input.active } : {}),
          ...(passwordHash !== undefined ? { passwordHash } : {}),
          ...(input.emailNorm !== undefined ? { emailNorm: input.emailNorm } : {}),
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new DomainError("USER_EMAIL_CONFLICT", "E-Mail ist in diesem Mandanten bereits vergeben.", 409);
      }
      throw e;
    }

    const updated = await this.prisma.user.findUniqueOrThrow({
      where: { tenantId_id: { tenantId, id: targetUserId } },
      select: { id: true, emailNorm: true, role: true, active: true, createdAt: true },
    });

    await this.audit.append({
      id: randomUUID(),
      tenantId,
      entityType: "USER",
      entityId: targetUserId,
      action: "USER_UPDATED",
      timestamp: new Date(),
      actorUserId,
      reason: input.reason,
      beforeState,
      afterState: {
        emailNorm: updated.emailNorm,
        role: updated.role,
        active: updated.active,
        passwordRotated: input.passwordPlain !== undefined,
        emailChanged: input.emailNorm !== undefined && input.emailNorm !== beforeState.emailNorm,
      },
    });

    return {
      id: updated.id,
      email: updated.emailNorm,
      role: assertRole(updated.role),
      active: updated.active,
      createdAt: updated.createdAt.toISOString(),
    };
  }
}
