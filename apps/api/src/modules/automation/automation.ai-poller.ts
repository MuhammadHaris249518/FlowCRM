import { prisma } from "../../lib/prisma";
import { resolveAiNode } from "./automation.engine";

export async function pollAiJobsOnce(): Promise<void> {
  const runs = await prisma.workflowRun.findMany({
    where: { status: "WAITING", aiJobId: { not: null }, resumeAt: { lte: new Date() } },
    take: 50,
  });

  for (const run of runs) {
    const workflow = await prisma.workflow.findUniqueOrThrow({
      where: { id: run.workflowId },
      include: { nodes: true, edges: true },
    });
    await resolveAiNode(run, workflow);
  }
}

export function startAiPoller(intervalMs = 5000): NodeJS.Timeout {
  return setInterval(() => {
    pollAiJobsOnce().catch((err) => {
      console.error("[ai-poller] error:", err);
    });
  }, intervalMs);
}
