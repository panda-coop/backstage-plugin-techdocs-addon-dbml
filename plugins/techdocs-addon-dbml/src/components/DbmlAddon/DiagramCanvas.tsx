import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type NodeChange,
  type NodeMouseHandler,
  type OnNodeDrag,
} from '@xyflow/react';
import type { Database } from '@dbml/core';
import {
  dbmlToFlow,
  type DbmlFlowNode,
  type RelationshipFlowEdge,
} from './dbmlToFlow';
import {
  filterGroupOverlapChanges,
  growGroupToChildren,
  pushNeighborsOutOfGroup,
  repositionExpandedGroup,
} from './groupLayout';
import { deriveDisplayEdges, deriveDisplayNodes } from './collapseDerivation';
import { CollapseContext, GroupNode, TableNode } from './TableNode';
import { RelationshipEdge } from './RelationshipEdge';
import { XYFLOW_STYLES } from './xyflowStyles';
import { useDbmlTheme } from './palette';

const nodeTypes = { dbmlTable: TableNode, dbmlGroup: GroupNode };
const edgeTypes = { dbmlRelationship: RelationshipEdge };

// React Flow sizes its per-edge svgs 0x0 and paints edges as overflow;
// inside a shadow root Chromium does not paint overflow of zero-sized
// svgs, hiding every edge. Give them a real paint box (harmless in the
// light DOM dialog).
const SHADOW_DOM_FIXES = `
.react-flow__edges,
.react-flow__edges svg {
  width: 100%;
  height: 100%;
}
`;

/**
 * The interactive diagram: pan, zoom, drag tables. Self-contained styling —
 * the vendored React Flow stylesheet is injected with a <style> tag so the
 * canvas works inside the TechDocs shadow root as well as in the dialog.
 *
 * `wheelZoom` is off for the inline embed so the mouse wheel keeps scrolling
 * the docs page (zoom stays available via the controls); the dialog enables
 * it.
 */
export const DiagramCanvas = ({
  database,
  wheelZoom = false,
}: {
  database: Database;
  wheelZoom?: boolean;
}) => {
  const { mode, palette } = useDbmlTheme();
  // Controlled state: dbmlToFlow output is the canonical layout, user
  // drags mutate React state (group growth and collapse derive from it).
  const initial = useMemo(() => dbmlToFlow(database), [database]);
  const [nodes, setNodes, onNodesChange] = useNodesState<DbmlFlowNode>(
    initial.nodes,
  );
  const [edges, setEdges, onEdgesChange] =
    useEdgesState<RelationshipFlowEdge>(initial.edges);
  useEffect(() => {
    setNodes(initial.nodes);
    setEdges(initial.edges);
  }, [initial, setNodes, setEdges]);

  // Collapse is display state derived from these sets (see
  // collapseDerivation.ts); the canonical nodes/edges keep full geometry
  // so expanding restores everything.
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const [collapsedTables, setCollapsedTables] = useState<Set<string>>(
    () => new Set(),
  );
  const toggleGroup = useCallback(
    (groupId: string) => {
      const next = new Set(collapsedGroups);
      const expanding = next.has(groupId);
      if (expanding) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      setCollapsedGroups(next);
      if (expanding) {
        // A compact block can be parked anywhere; its full bounds may not
        // fit there — push the expanded group into free space.
        setNodes(current => repositionExpandedGroup(current, groupId, next));
      }
    },
    [collapsedGroups, setNodes],
  );
  // One toggle for both node kinds: the chevrons in GroupNode and
  // TableNode hand back their node id and the canvas dispatches on type.
  const toggleCollapse = useCallback(
    (nodeId: string) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) {
        return;
      }
      if (node.type === 'dbmlGroup') {
        toggleGroup(nodeId);
        return;
      }
      setCollapsedTables(prev => {
        const next = new Set(prev);
        if (next.has(nodeId)) {
          next.delete(nodeId);
        } else {
          next.add(nodeId);
        }
        return next;
      });
    },
    [nodes, toggleGroup],
  );
  const handleNodeClick = useCallback<NodeMouseHandler<DbmlFlowNode>>(
    (_event, node) => {
      if (node.type === 'dbmlGroup') {
        toggleGroup(node.id);
      }
    },
    [toggleGroup],
  );

  // Groups may not land on top of each other (at their on-screen size, so
  // a collapsed block moves freely); a table dragged inside its group
  // grows the group's bounds so it never leaves it.
  const handleNodesChange = useCallback(
    (changes: NodeChange<DbmlFlowNode>[]) =>
      onNodesChange(filterGroupOverlapChanges(changes, nodes, collapsedGroups)),
    [onNodesChange, nodes, collapsedGroups],
  );
  const handleNodeDrag = useCallback<OnNodeDrag<DbmlFlowNode>>(
    (_event, node) => {
      if (node.parentId) {
        // Grow the group around the dragged table, then shove whatever
        // top-level neighbors the grown bounds now overlap.
        setNodes(current =>
          pushNeighborsOutOfGroup(
            growGroupToChildren(current, node.parentId!),
            node.parentId!,
            collapsedGroups,
          ),
        );
      }
    },
    [setNodes, collapsedGroups],
  );

  const displayNodes = useMemo(
    () => deriveDisplayNodes(nodes, collapsedGroups, collapsedTables),
    [nodes, collapsedGroups, collapsedTables],
  );
  const displayEdges = useMemo(
    () => deriveDisplayEdges(edges, nodes, collapsedGroups, collapsedTables),
    [edges, nodes, collapsedGroups, collapsedTables],
  );

  // dbdiagram-style edges: thin grey smoothstep, crow's foot glyphs at the
  // ends, both recoloring together on hover/selection. Handles stay in the
  // DOM as edge anchors but are never shown. Placed after the vendored
  // sheet so the hover/selected rules override its .selected styling.
  const edgeCss = `
.react-flow__handle {
  opacity: 0;
  pointer-events: none;
}
.react-flow__edge .react-flow__edge-path,
.react-flow__edge .dbml-edge-end {
  stroke: ${palette.edge};
  stroke-width: 1.25;
  fill: none;
}
.react-flow__edge:hover .react-flow__edge-path,
.react-flow__edge:hover .dbml-edge-end,
.react-flow__edge.selected .react-flow__edge-path,
.react-flow__edge.selected .dbml-edge-end {
  stroke: ${palette.edgeActive};
  stroke-width: 1.75;
}
`;

  // The zoom/fit controls follow the widget chrome (paper surface) instead
  // of React Flow's own colorMode styling.
  const themedControlsCss = `
.react-flow__controls {
  box-shadow: none;
  border: 1px solid ${palette.divider};
  border-radius: 6px;
  overflow: hidden;
}
.react-flow__controls-button {
  background: ${palette.frameBg};
  border-bottom: 1px solid ${palette.divider};
  color: ${palette.text};
  fill: ${palette.text};
}
.react-flow__controls-button:last-child {
  border-bottom: none;
}
.react-flow__controls-button:hover {
  background: ${palette.canvasBg};
}
`;

  return (
    <div
      style={{ width: '100%', height: '100%', background: palette.canvasBg }}
    >
      <style>
        {XYFLOW_STYLES}
        {SHADOW_DOM_FIXES}
        {edgeCss}
        {themedControlsCss}
      </style>
      <ReactFlowProvider>
        <CollapseContext.Provider value={toggleCollapse}>
          <ReactFlow
            nodes={displayNodes}
            edges={displayEdges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDrag={handleNodeDrag}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            colorMode={mode}
            fitView
            minZoom={0.1}
            nodesConnectable={false}
            deleteKeyCode={null}
            zoomOnScroll={wheelZoom}
            preventScrolling={wheelZoom}
            proOptions={{ hideAttribution: true }}
          >
            {/* Explicit colors: React Flow's colorMode otherwise paints its
                own near-black background over the theme canvas color. */}
            <Background
              gap={16}
              bgColor={palette.canvasBg}
              color={palette.muted}
            />
            <Controls showInteractive={false} />
          </ReactFlow>
        </CollapseContext.Provider>
      </ReactFlowProvider>
    </div>
  );
};
