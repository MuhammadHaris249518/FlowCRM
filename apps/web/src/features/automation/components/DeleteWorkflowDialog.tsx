"use client";

import { Modal } from "@/components/shared/Modal";
import { useDeleteWorkflow } from "../hooks/use-automation";
import type { WorkflowDTO } from "../types";

export function DeleteWorkflowDialog({
  workflow,
  onClose,
}: {
  workflow: WorkflowDTO | null;
  onClose: () => void;
}) {
  const deleteWorkflow = useDeleteWorkflow();

  return (
    <Modal open={Boolean(workflow)} onClose={onClose} title="Delete workflow">
      <p className="text-sm text-ink-700">
        Delete <span className="font-semibold">{workflow?.name}</span>? Runs already in progress will stop; this
        can't be undone.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-ink-700 hover:bg-surface-muted"
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            if (!workflow) return;
            await deleteWorkflow.mutateAsync(workflow.id);
            onClose();
          }}
          disabled={deleteWorkflow.isPending}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {deleteWorkflow.isPending ? "Deleting…" : "Delete workflow"}
        </button>
      </div>
    </Modal>
  );
}
