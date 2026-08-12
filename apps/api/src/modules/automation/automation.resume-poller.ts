import { prisma } from "../../lib/prisma";
import { advanceRun } from "./automation.engine";

export async function pollResumableRunsOnce(): Promise<void> {
  const runs = await prisma.workflowRun.findMany({
    where: { status: "WAITING", aiJobId: null, resumeAt: { lte: new Date() } },
    take: 50,
  });

  for (const run of runs) {
    const workflow = await prisma.workflow.findUniqueOrThrow({
      where: { id: run.workflowId },
      include: { nodes: true, edges: true },
    });
    await prisma.workflowRun.update({ where: { id: run.id }, data: { status: "RUNNING" } });
    await advanceRun(run, workflow);
  }
}

export function startResumePoller(intervalMs = 60000): NodeJS.Timeout {
  return setInterval(() => {
    pollResumableRunsOnce().catch((err) => {
      console.error("[resume-poller] error:", err);
    });
  }, intervalMs);
}
