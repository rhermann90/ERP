import { Prisma, type PrismaClient } from "@prisma/client";
import type { PrismaTransactionClient } from "../persistence/prisma-tx-types.js";
import { AuditEvent, AuditEventView, TenantId } from "../domain/types.js";
import { InMemoryRepositories } from "../repositories/in-memory-repositories.js";
import { DomainError } from "../errors/domain-error.js";

export class AuditService {
  constructor(
    private readonly repos: InMemoryRepositories,
    private readonly prisma: PrismaClient | null = null,
  ) {}

  private toAuditCreateInput(event: AuditEvent): Prisma.AuditEventCreateInput {
    const data: Prisma.AuditEventCreateInput = {
      id: event.id,
      tenantId: event.tenantId,
      entityType: event.entityType,
      entityId: event.entityId,
      action: event.action,
      timestamp: event.timestamp,
      actorUserId: event.actorUserId,
      reason: event.reason ?? null,
    };
    if (event.beforeState !== undefined) {
      data.beforeState = event.beforeState as Prisma.InputJsonValue;
    }
    if (event.afterState !== undefined) {
      data.afterState = event.afterState as Prisma.InputJsonValue;
    }
    return data;
  }

  /** Nur In-Memory (z. B. nach erfolgreicher DB-Transaktion). */
  public appendInMemoryOnly(event: AuditEvent): void {
    this.repos.auditEvents.push(event);
  }

  /** Audit-Zeile innerhalb einer laufenden Prisma-Transaktion (ohne In-Memory). */
  public async appendAuditEventTx(tx: PrismaTransactionClient, event: AuditEvent): Promise<void> {
    const data = this.toAuditCreateInput(event);
    try {
      await tx.auditEvent.create({ data });
    } catch (err: unknown) {
      console.error("[erp] audit_event persist failed (tx)", err);
      throw new DomainError(
        "AUDIT_PERSIST_FAILED",
        "Audit-Ereignis konnte nicht persistiert werden",
        500,
      );
    }
  }

  /**
   * Schreibt das Audit-Ereignis. Bei Postgres: **fail-hard** — DB-Insert muss gelingen, sonst `DomainError` 500
   * (kein stilles Fortfahren; In-Memory wird erst nach erfolgreichem DB-Write gesetzt).
   */
  public async append(event: AuditEvent): Promise<void> {
    if (!this.prisma) {
      this.repos.auditEvents.push(event);
      return;
    }

    try {
      await this.prisma.auditEvent.create({ data: this.toAuditCreateInput(event) });
    } catch (err: unknown) {
      console.error("[erp] audit_event persist failed", err);
      throw new DomainError(
        "AUDIT_PERSIST_FAILED",
        "Audit-Ereignis konnte nicht persistiert werden",
        500,
      );
    }
    this.repos.auditEvents.push(event);
  }

  public async listByTenant(input: {
    tenantId: TenantId;
    role: "ADMIN" | "BUCHHALTUNG" | "GESCHAEFTSFUEHRUNG" | "VERTRIEB_BAULEITUNG" | "VIEWER";
    page: number;
    pageSize: number;
  }): Promise<{ data: AuditEventView[]; page: number; pageSize: number; total: number }> {
    const allowedRoles = new Set(["ADMIN", "BUCHHALTUNG", "GESCHAEFTSFUEHRUNG"]);
    if (!allowedRoles.has(input.role)) {
      throw new DomainError("FORBIDDEN_AUDIT_READ", "Keine Berechtigung für Audit-Ansicht", 403);
    }

    if (this.prisma) {
      const where = { tenantId: input.tenantId };
      const total = await this.prisma.auditEvent.count({ where });
      const rows = await this.prisma.auditEvent.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        select: {
          id: true,
          entityType: true,
          entityId: true,
          action: true,
          timestamp: true,
          actorUserId: true,
        },
      });
      const data: AuditEventView[] = rows.map((r) => ({
        id: r.id,
        entityType: r.entityType as AuditEvent["entityType"],
        entityId: r.entityId,
        action: r.action as AuditEvent["action"],
        timestamp: r.timestamp,
        actorUserId: r.actorUserId,
      }));
      return { data, page: input.page, pageSize: input.pageSize, total };
    }

    const filtered = this.repos.auditEvents
      .filter((event) => event.tenantId === input.tenantId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const start = (input.page - 1) * input.pageSize;
    const pageData = filtered.slice(start, start + input.pageSize);
    const minimized: AuditEventView[] = pageData.map((event) => ({
      id: event.id,
      entityType: event.entityType,
      entityId: event.entityId,
      action: event.action,
      timestamp: event.timestamp,
      actorUserId: event.actorUserId,
    }));
    return { data: minimized, page: input.page, pageSize: input.pageSize, total: filtered.length };
  }
}
