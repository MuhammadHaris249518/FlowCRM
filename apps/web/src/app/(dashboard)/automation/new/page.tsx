"use client";

import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { WorkflowCanvas } from "@/features/automation/components/WorkflowCanvas";
import { useCreateWorkflow } from "@/features/automation/hooks/use-automation";
import { flowToPayload } from "@/features/automation/lib/graph-transform";

export default function NewWorkflowPage() {
  const router = useRouter();
  const createWorkflow = useCreateWorkflow();

  return (
    <>
      <Topbar title="New Workflow" />
      <main className="p-6 sm:p-8">
        <WorkflowCanvas
          initialName=""
          initialActive={false}
          initialNodes={[]}
          initialEdges={[]}
          canEdit
          saving={createWorkflow.isPending}
          onSave={async (draft) => {
            const payload = flowToPayload(draft);
            const created = await createWorkflow.mutateAsync(payload);
            router.replace(`/automation/${created.id}`);
          }}
        />
      </main>
    </>
  );
}
