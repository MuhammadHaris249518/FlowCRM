import type { Prisma, OutboxEventType } from "@prisma/client";

/**
 * Writes an OutboxEvent row using the same transaction client (`tx`) as the
 * domain write that triggered it. Must always be called from inside an
 * existing `prisma.$transaction(async (tx) => { ... })` block — never with
 * the top-level `prisma` client — so the event and the data change commit
 * or roll back together.
 */
export async function emitOutboxEvent(
  tx: Prisma.TransactionClient,
  params: {
    organizationId: string;
    type: OutboxEventType;
    payload: Record<string, unknown>;
  }
): Promise<void> {
  await tx.outboxEvent.create({
    data: {
      organizationId: params.organizationId,
      type: params.type,
      payload: params.payload as Prisma.InputJsonObject,
    },
  });
}
