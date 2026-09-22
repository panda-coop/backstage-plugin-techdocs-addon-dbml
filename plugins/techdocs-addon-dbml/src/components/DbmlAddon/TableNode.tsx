import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  HEADER_HEIGHT,
  NODE_WIDTH,
  ROW_HEIGHT,
  type GroupFlowNode,
  type TableFlowNode,
} from './dbmlToFlow';
import { useDbmlTheme } from './palette';

const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export const TableNode = ({ data }: NodeProps<TableFlowNode>) => {
  const { palette } = useDbmlTheme();

  return (
    <div
      style={{
        width: NODE_WIDTH,
        border: `1px solid ${palette.nodeBorder}`,
        borderRadius: 6,
        background: palette.nodeBg,
        color: palette.text,
        fontFamily: mono,
        fontSize: 12,
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)',
      }}
    >
      <div
        style={{
          height: HEADER_HEIGHT,
          lineHeight: `${HEADER_HEIGHT}px`,
          padding: '0 10px',
          background: data.headerColor || palette.header,
          color: palette.headerText,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={data.note}
      >
        {data.label}
      </div>
      {data.fields.map(field => (
        <div
          key={field.name}
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 8,
            height: ROW_HEIGHT,
            lineHeight: `${ROW_HEIGHT}px`,
            padding: '0 10px',
            borderTop: `1px solid ${palette.rowBorder}`,
            whiteSpace: 'nowrap',
          }}
          title={field.note}
        >
          {/* Invisible (hidden via the canvas stylesheet) but measured, so
              edges keep anchoring to the column row. */}
          <Handle
            type="target"
            position={Position.Left}
            id={`${field.name}-target`}
            isConnectable={false}
          />
          <span style={{ fontWeight: field.pk ? 700 : 400 }}>
            {field.pk ? `${field.name} [pk]` : field.name}
          </span>
          <span style={{ color: palette.muted }}>
            {field.type}
            {field.notNull && !field.pk ? ' *' : ''}
          </span>
          <Handle
            type="source"
            position={Position.Right}
            id={`${field.name}-source`}
            isConnectable={false}
          />
        </div>
      ))}
    </div>
  );
};

export const GroupNode = ({ data }: NodeProps<GroupFlowNode>) => {
  const { palette } = useDbmlTheme();
  const color = data.color || palette.muted;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        border: `1.5px dashed ${color}`,
        borderRadius: 8,
        background: `color-mix(in srgb, ${color} 8%, transparent)`,
      }}
      title={data.note}
    >
      <div
        style={{
          padding: '4px 10px',
          fontFamily: mono,
          fontSize: 12,
          fontWeight: 700,
          color,
        }}
      >
        {data.label}
      </div>
    </div>
  );
};
