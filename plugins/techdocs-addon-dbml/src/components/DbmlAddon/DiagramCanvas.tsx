import { useMemo } from 'react';
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import type { Database } from '@dbml/core';
import { dbmlToFlow } from './dbmlToFlow';
import { GroupNode, TableNode } from './TableNode';
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
  const { nodes, edges } = useMemo(() => dbmlToFlow(database), [database]);

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
        <ReactFlow
          defaultNodes={nodes}
          defaultEdges={edges}
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
      </ReactFlowProvider>
    </div>
  );
};
