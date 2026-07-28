import { prisma } from "../../lib/prisma";
import type { AuthContext } from "../../middleware/auth";
import type { CreateWorkflowInput, UpdateWorkflowInput, PaginationQuery } from "./automation.validation";

export const automationRepository = {
  async list(auth: AuthContext, query: PaginationQuery) {
    const where = { organizationId: auth.organizationId };
    const [items, total] = await Promise.all([
      prisma.workflow.findMany({
        where,
        include: { nodes: true, edges: true },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.workflow.count({ where }),
    ]);
    return { items, total };
  },

  async getById(auth: AuthContext, id: string) {
    return prisma.workflow.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: { nodes: true, edges: true },
    });
  },

  async exists(auth: AuthContext, id: string): Promise<boolean> {
    const count = await prisma.workflow.count({
      where: { id, organizationId: auth.organizationId },
    });
    return count > 0;
  },

  // Nodes are created with client-supplied temp ids first (to resolve edge
  // source/target references), then edges are created pointing at the real
  // DB-generated node ids via a temp-id -> real-id map built in this same tx.
  async create(auth: AuthContext, input: CreateWorkflowInput) {
    return prisma.$transaction(async (tx) => {
      const workflow = await tx.workflow.create({
        data: {
          name: input.name,
          isActive: input.isActive,
          organizationId: auth.organizationId,
        },
      });

      const tempIdToRealId = new Map<string, string>();
      for (const node of input.nodes) {
        const created = await tx.workflowNode.create({
          data: {
            workflowId: workflow.id,
            type: node.type,
            config: node.config as object,
            positionX: node.positionX,
            positionY: node.positionY,
          },
        });
        tempIdToRealId.set(node.id, created.id);
      }

      for (const edge of input.edges) {
        const sourceId = tempIdToRealId.get(edge.sourceNodeId);
        const targetId = tempIdToRealId.get(edge.targetNodeId);
        if (!sourceId || !targetId) {
          throw new Error(
            `Edge references unknown node id: ${edge.sourceNodeId} -> ${edge.targetNodeId}`
          );
        }
        await tx.workflowEdge.create({
          data: {
            workflowId: workflow.id,
            sourceNodeId: sourceId,
            targetNodeId: targetId,
            label: edge.label,
          },
        });
      }

      return tx.workflow.findUniqueOrThrow({
        where: { id: workflow.id },
        include: { nodes: true, edges: true },
      });
    });
  },

  async update(auth: AuthContext, id: string, input: UpdateWorkflowInput) {
    // Nodes/edges, if present, fully replace the existing graph — simpler
    // and safer than diffing for v1, at the cost of losing WorkflowRunLog's
    // ability to join against a node that no longer exists after an edit.
    // Acceptable tradeoff for now: logs keep the nodeId string regardless.
    return prisma.$transaction(async (tx) => {
      if (input.name !== undefined || input.isActive !== undefined) {
        await tx.workflow.update({
          where: { id },
          data: { name: input.name, isActive: input.isActive },
        });
      }

      if (input.nodes && input.edges) {
        await tx.workflowEdge.deleteMany({ where: { workflowId: id } });
        await tx.workflowNode.deleteMany({ where: { workflowId: id } });

        const tempIdToRealId = new Map<string, string>();
        for (const node of input.nodes) {
          const created = await tx.workflowNode.create({
            data: {
              workflowId: id,
              type: node.type,
              config: node.config as object,
              positionX: node.positionX,
              positionY: node.positionY,
            },
          });
          tempIdToRealId.set(node.id, created.id);
        }
        for (const edge of input.edges) {
          const sourceId = tempIdToRealId.get(edge.sourceNodeId);
          const targetId = tempIdToRealId.get(edge.targetNodeId);
          if (!sourceId || !targetId) {
            throw new Error(
              `Edge references unknown node id: ${edge.sourceNodeId} -> ${edge.targetNodeId}`
            );
          }
          await tx.workflowEdge.create({
            data: { workflowId: id, sourceNodeId: sourceId, targetNodeId: targetId, label: edge.label },
          });
        }
      }

      return tx.workflow.findUniqueOrThrow({
        where: { id },
        include: { nodes: true, edges: true },
      });
    });
  },

  async delete(auth: AuthContext, id: string) {
    await prisma.workflow.delete({ where: { id } });
  },

  // --- Engine-facing queries (not scoped by a single request's auth) ---

  async findActiveWorkflowsForTrigger(organizationId: string, eventType: string) {
    const workflows = await prisma.workflow.findMany({
      where: { organizationId, isActive: true },
      include: { nodes: true, edges: true },
    });
    return workflows.filter((wf) =>
      wf.nodes.some(
        (n) => n.type === "TRIGGER" && (n.config as { trigger?: string }).trigger === eventType
      )
    );
  },
};
