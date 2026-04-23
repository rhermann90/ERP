import type { PrismaClient } from "@prisma/client";

/** Client innerhalb von `prisma.$transaction` (interaktiv). */
export type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;
