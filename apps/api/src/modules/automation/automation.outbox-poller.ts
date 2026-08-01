import { prisma } from "../../lib/prisma";
import { automationRepository } from "./automation.repository";
import { startRun } from "./automation.engine";

const BATCH_SIZE = 50;

export async function pollOutboxOnce(): Promise<void> {
  const events = await prisma.outboxEvent.findMany({
    where: { processedAt: null },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });

  for (const event of events) {
    const workflows = await automationRepository.findActiveWorkflowsForTrigger(
      event.organizationId,
      event.type
    );

    const payload = event.payload as { entityType: string; entityId: string; [key: string]: unknown };

    for (const workflow of workflows) {
      await startRun(workflow, payload.entityType, payload.entityId, {
        ...payload,
        organizationId: event.organizationId,
        entityType: payload.entityType,
        entityId: payload.entityId,
      });
    }

    await prisma.outboxEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date() },
    });
  }
}

export function startOutboxPoller(intervalMs = 5000): NodeJS.Timeout {
  return setInterval(() => {
    pollOutboxOnce().catch((err) => {
      console.error("[outbox-poller] error:", err);
    });
  }, intervalMs);
}
