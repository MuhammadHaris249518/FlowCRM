"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";

import { NodePalette, PALETTE_DRAG_MIME } from "./NodePalette";
import { NodeConfigPanel } from "./NodeConfigPanel";
import { WorkflowToolbar } from "./WorkflowToolbar";
import { nodeTypes } from "./nodes";
import { NODE_TYPE_DEFS, getDefaultConfig } from "../lib/node-defs";
import { generateNodeId, type BuilderEdge, type BuilderNode } from "../lib/graph-transform";
import { validateWorkflowGraph } from "../validation";
import type { WorkflowNodeType } from "../types";

interface Props {
  initialName: string;
  initialActive: boolean;
  initialNodes: BuilderNode[];
  initialEdges: BuilderEdge[];
  canEdit: boolean;
  saving: boolean;
  onSave: (draft: { name: string; isActive: boolean; nodes: BuilderNode[]; edges: BuilderEdge[] }) => void;
}

export function WorkflowCanvas({
  initialName,
  initialActive,
  initialNodes,
  initialEdges,
  canEdit,
  saving,
  onSave,
}: Props) {
  const [name, setName] = useState(initialName);
  const [isActive, setIsActive] = useState(initialActive);
  const [nodes, setNodes] = useState<BuilderNode[]>(initialNodes);
  const [edges, setEdges] = useState<BuilderEdge[]>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null);

  const markDirty = useCallback(() => setDirty(true), []);

  // Warn before an accidental tab close/navigation with unsaved work — this
  // app saves explicitly (see §0 design decisions), so this guard is the
  // safety net that decision otherwise trades away.
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
    if (changes.some((c) => c.type !== "select")) markDirty();
  }, [markDirty]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
    markDirty();
  }, [markDirty]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
      markDirty();
    },
    [markDirty]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData(PALETTE_DRAG_MIME) as WorkflowNodeType;
      if (!type || !flowInstance || !wrapperRef.current) return;

      const bounds = wrapperRef.current.getBoundingClientRect();
      const position = flowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newNode: BuilderNode = {
        id: generateNodeId(),
        type,
        position,
        data: { nodeType: type, config: getDefaultConfig(type) },
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(newNode.id);
      markDirty();
    },
    [flowInstance, markDirty]
  );

  const updateNodeConfig = useCallback((nodeId: string, config: Record<string, unknown>) => {
    setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, config } } : n)));
    markDirty();
  }, [markDirty]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNodeId(null);
    markDirty();
  }, [markDirty]);

  const hasTrigger = useMemo(() => nodes.some((n) => n.data.nodeType === "TRIGGER"), [nodes]);
  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) ?? null, [nodes, selectedNodeId]);

  const errors = useMemo(
    () =>
      validateWorkflowGraph({
        name,
        nodes: nodes.map((n) => ({ id: n.id, type: n.data.nodeType, config: n.data.config })),
        edges: edges.map((e) => ({ sourceNodeId: e.source, targetNodeId: e.target })),
      }),
    [name, nodes, edges]
  );

  function handleSave() {
    onSave({ name, isActive, nodes, edges });
    setDirty(false);
  }

  return (
    <div>
      <WorkflowToolbar
        name={name}
        onNameChange={(v) => {
          setName(v);
          markDirty();
        }}
        isActive={isActive}
        onActiveChange={(v) => {
          setIsActive(v);
          markDirty();
        }}
        canEdit={canEdit}
        dirty={dirty}
        saving={saving}
        errors={errors}
        onSave={handleSave}
      />

      <div className="flex gap-4">
        {canEdit && <NodePalette hasTrigger={hasTrigger} />}

        <div
          ref={wrapperRef}
          className="h-[70vh] flex-1 overflow-hidden rounded-2xl border border-surface-border bg-surface-muted"
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={canEdit ? onNodesChange : undefined}
            onEdgesChange={canEdit ? onEdgesChange : undefined}
            onConnect={canEdit ? onConnect : undefined}
            onInit={setFlowInstance}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            nodesDraggable={canEdit}
            nodesConnectable={canEdit}
            elementsSelectable={canEdit}
            fitView
          >
            <Background gap={16} />
            <Controls showInteractive={false} />
            <MiniMap
              nodeColor={(n) => (NODE_TYPE_DEFS[(n.data as { nodeType: WorkflowNodeType }).nodeType].accent.match(/#?\w+-600/)?.[0] ? "#6238f2" : "#a6aabd")}
              pannable
              zoomable
            />
          </ReactFlow>
        </div>

        {canEdit && (
          <NodeConfigPanel
            node={selectedNode}
            onChange={updateNodeConfig}
            onDelete={deleteNode}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>
    </div>
  );
}
