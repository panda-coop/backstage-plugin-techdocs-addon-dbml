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

const nodeTypes = { dbmlTable: TableNode, dbmlGroup: GroupNode };

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
  const { nodes, edges } = useMemo(() => dbmlToFlow(database), [database]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#fafafa' }}>
      <style>{XYFLOW_STYLES}</style>
      <ReactFlowProvider>
        <ReactFlow
          defaultNodes={nodes}
          defaultEdges={edges}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          nodesConnectable={false}
          deleteKeyCode={null}
          zoomOnScroll={wheelZoom}
          preventScrolling={wheelZoom}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};
