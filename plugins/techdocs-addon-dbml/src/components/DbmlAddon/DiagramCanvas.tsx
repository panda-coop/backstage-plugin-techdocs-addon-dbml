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
import { XYFLOW_STYLES } from './xyflowStyles';
import { useDbmlTheme } from './palette';

const nodeTypes = { dbmlTable: TableNode, dbmlGroup: GroupNode };

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
        {themedControlsCss}
      </style>
      <ReactFlowProvider>
        <ReactFlow
          defaultNodes={nodes}
          defaultEdges={edges}
          nodeTypes={nodeTypes}
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
