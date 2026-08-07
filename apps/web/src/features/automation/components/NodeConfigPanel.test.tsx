import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NodeConfigPanel } from "./NodeConfigPanel";
import type { BuilderNode } from "../lib/graph-transform";

const triggerNode: BuilderNode = {
  id: "n1",
  type: "TRIGGER",
  position: { x: 0, y: 0 },
  data: { nodeType: "TRIGGER", config: { trigger: "LEAD_CREATED" } },
};

describe("NodeConfigPanel", () => {
  it("shows a placeholder when no node is selected", () => {
    render(<NodeConfigPanel node={null} onChange={vi.fn()} onDelete={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/select a node/i)).toBeInTheDocument();
  });

  it("renders trigger fields and calls onChange with the updated config on select", () => {
    const onChange = vi.fn();
    render(<NodeConfigPanel node={triggerNode} onChange={onChange} onDelete={vi.fn()} onClose={vi.fn()} />);

    const select = screen.getByLabelText(/fires when/i) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "DEAL_STAGE_CHANGED" } });

    expect(onChange).toHaveBeenCalledWith("n1", { trigger: "DEAL_STAGE_CHANGED" });
  });

  it("calls onDelete with the node id when Delete node is clicked", () => {
    const onDelete = vi.fn();
    render(<NodeConfigPanel node={triggerNode} onChange={vi.fn()} onDelete={onDelete} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /delete node/i }));
    expect(onDelete).toHaveBeenCalledWith("n1");
  });

  it("shows a validation error for an incomplete condition node", () => {
    const conditionNode: BuilderNode = {
      id: "n2",
      type: "CONDITION",
      position: { x: 0, y: 0 },
      data: { nodeType: "CONDITION", config: { field: "", op: "eq", value: "" } },
    };
    render(<NodeConfigPanel node={conditionNode} onChange={vi.fn()} onDelete={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/field is required/i)).toBeInTheDocument();
  });
});
