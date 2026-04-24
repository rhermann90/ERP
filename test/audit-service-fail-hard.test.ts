import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { InMemoryRepositories } from "../src/repositories/in-memory-repositories.js";
import { AuditService } from "../src/services/audit-service.js";

describe("AuditService fail-hard (Postgres)", () => {
  it("throws DomainError AUDIT_PERSIST_FAILED when audit_event create fails", async () => {
    const repos = new InMemoryRepositories();
    const prisma = {
      auditEvent: {
        create: async () => {
          throw new Error("simulated db failure");
        },
      },
    };
    const audit = new AuditService(repos, prisma as never);

    const event = {
      id: randomUUID(),
      tenantId: "11111111-1111-4111-8111-111111111111",
      entityType: "OFFER_VERSION" as const,
      entityId: randomUUID(),
      action: "VERSION_CREATED" as const,
      timestamp: new Date(),
      actorUserId: randomUUID(),
    };

    await expect(audit.append(event)).rejects.toMatchObject({
      code: "AUDIT_PERSIST_FAILED",
      statusCode: 500,
    });
    expect(repos.auditEvents.some((e) => e.id === event.id)).toBe(false);
  });

  it("appendAuditEventTx throws DomainError AUDIT_PERSIST_FAILED when tx create fails", async () => {
    const repos = new InMemoryRepositories();
    const audit = new AuditService(repos, null);
    const tx = {
      auditEvent: {
        create: async () => {
          throw new Error("simulated tx failure");
        },
      },
    };
    const event = {
      id: randomUUID(),
      tenantId: "11111111-1111-4111-8111-111111111111",
      entityType: "DUNNING_TENANT_STAGE_CONFIG" as const,
      entityId: "22222222-2222-4222-8222-222222222222",
      action: "DUNNING_STAGES_REPLACED" as const,
      timestamp: new Date(),
      actorUserId: randomUUID(),
      reason: "unit tx fail",
    };

    await expect(audit.appendAuditEventTx(tx as never, event)).rejects.toMatchObject({
      code: "AUDIT_PERSIST_FAILED",
      statusCode: 500,
    });
    expect(repos.auditEvents.some((e) => e.id === event.id)).toBe(false);
  });

  it("appends to memory only when prisma is null", async () => {
    const repos = new InMemoryRepositories();
    const audit = new AuditService(repos, null);
    const event = {
      id: randomUUID(),
      tenantId: "11111111-1111-4111-8111-111111111111",
      entityType: "OFFER_VERSION" as const,
      entityId: randomUUID(),
      action: "VERSION_CREATED" as const,
      timestamp: new Date(),
      actorUserId: randomUUID(),
    };
    await audit.append(event);
    expect(repos.auditEvents.some((e) => e.id === event.id)).toBe(true);
  });
});
