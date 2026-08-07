"use client";

import { useParams } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { WorkflowCanvas } from "@/features/automation/components/WorkflowCanvas";
import { useMe } from "@/features/auth/hooks/use-me";
import { useActiveOrganization } from "@/features/auth/provider/ActiveOrganizationProvider";
import { useUpdateWorkflow, useWorkflow } from "@/features/automation/hooks/use-automation";
import { dtoToFlow, flowToPayload } from "@/features/automation/lib/graph-transform";

const EDITOR_ROLES = new Set(["ORG_OWNER", "SALES_MANAGER", "SUPER_ADMIN"]);

export default function EditWorkflowPage() {
  const params = useParams<{ id: string }>();
  const workflow = useWorkflow(params.id);
  const updateWorkflow = useUpdateWorkflow(params.id);

  const me = useMe();
  const { activeOrganizationId } = useActiveOrganization();
  const activeRole = me.data?.organizations.find((o) => o.id === activeOrganizationId)?.role;
  // Server is the source of truth for this (see §2 route patch) — this only
  // controls whether the builder renders editable inputs or a read-only view.
  const canEdit = activeRole ? EDITOR_ROLES.has(activeRole) : false;

  return (
    <>
      <Topbar title="Edit Workflow" />
      <main className="p-6 sm:p-8">
        {workflow.isPending && <div className="h-96 animate-pulse rounded-2xl bg-white/60" />}
        {workflow.isError && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">Couldn't load this workflow.</div>
        )}
        {workflow.data && (
          <WorkflowCanvasHost
            workflow={workflow.data}
            canEdit={canEdit}
            saving={updateWorkflow.isPending}
            onSave={async (draft) => {
              await updateWorkflow.mutateAsync(flowToPayload(draft));
            }}
          />
        )}
      </main>
    </>
  );
}

// Split out so dtoToFlow only runs once per fetched workflow, not on every
// parent re-render (WorkflowCanvas owns its own node/edge state after mount).
function WorkflowCanvasHost({
  workflow,
  canEdit,
  saving,
  onSave,
}: {
  workflow: import("@/features/automation/types").WorkflowDTO;
  canEdit: boolean;
  saving: boolean;
  onSave: Parameters<typeof WorkflowCanvas>[0]["onSave"];
}) {
  const { nodes, edges } = dtoToFlow(workflow);
  return (
    <WorkflowCanvas
      key={workflow.id}
      initialName={workflow.name}
      initialActive={workflow.isActive}
      initialNodes={nodes}
      initialEdges={edges}
      canEdit={canEdit}
      saving={saving}
      onSave={onSave}
    />
  );
}
