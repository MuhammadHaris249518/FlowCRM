import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkflowCanvas } from "./WorkflowCanvas";

// reactflow needs ResizeObserver + a real layout engine jsdom doesn't provide;
// vitest.setup.ts polyfills ResizeObserver globally (see §12) which is enough
// for it to mount without throwing.

describe("WorkflowCanvas", () => {
  it("renders the toolbar with the initial workflow name", () => {
    render(
      <WorkflowCanvas
        initialName="My Workflow"
        initialActive={false}
        initialNodes={[]}
        initialEdges={[]}
        canEdit
        saving={false}
        onSave={vi.fn()}
      />
    );
    expect(screen.getByDisplayValue("My Workflow")).toBeInTheDocument();
  });

  it("disables the Save button and shows the empty-graph error when there are no nodes", () => {
    render(
      <WorkflowCanvas
        initialName="Empty"
        initialActive={false}
        initialNodes={[]}
        initialEdges={[]}
        canEdit
        saving={false}
        onSave={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /save workflow/i })).toBeDisabled();
    expect(screen.getByText(/add at least one node/i)).toBeInTheDocument();
  });

  it("hides the palette and config panel, and disables inputs, when canEdit is false", () => {
    render(
      <WorkflowCanvas
        initialName="Read only"
        initialActive={true}
        initialNodes={[]}
        initialEdges={[]}
        canEdit={false}
        saving={false}
        onSave={vi.fn()}
      />
    );
    expect(screen.getByDisplayValue("Read only")).toBeDisabled();
    expect(screen.getByText(/view only/i)).toBeInTheDocument();
    expect(screen.queryByText(/drag a node onto the canvas/i)).not.toBeInTheDocument();
  });

  it("calls onSave with the current draft when Save is clicked on a valid graph", () => {
    const onSave = vi.fn();
    const triggerNode = {
      id: "n1",
      type: "TRIGGER" as const,
      position: { x: 0, y: 0 },
      data: { nodeType: "TRIGGER" as const, config: { trigger: "LEAD_CREATED" } },
    };
    render(
      <WorkflowCanvas
        initialName="Valid"
        initialActive={false}
        initialNodes={[triggerNode]}
        initialEdges={[]}
        canEdit
        saving={false}
        onSave={onSave}
      />
    );

    const saveButton = screen.getByRole("button", { name: /save workflow/i });
    expect(saveButton).not.toBeDisabled();
    saveButton.click();
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Valid", isActive: false, nodes: [triggerNode], edges: [] })
    );
  });
});
