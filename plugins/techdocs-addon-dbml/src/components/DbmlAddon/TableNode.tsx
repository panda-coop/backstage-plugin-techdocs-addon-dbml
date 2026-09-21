import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  HEADER_HEIGHT,
  NODE_WIDTH,
  NOTE_HEIGHT,
  ROW_HEIGHT,
  type GroupFlowNode,
  type TableFlowNode,
} from './dbmlToFlow';

const nodeStyle: React.CSSProperties = {
  width: NODE_WIDTH,
  border: '1px solid #90a4ae',
  borderRadius: 6,
  background: '#ffffff',
  color: '#263238',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 12,
  overflow: 'hidden',
  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)',
};

const headerStyle: React.CSSProperties = {
  height: HEADER_HEIGHT,
  lineHeight: `${HEADER_HEIGHT}px`,
  padding: '0 10px',
  background: '#37474f',
  color: '#ffffff',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const noteStyle: React.CSSProperties = {
  height: NOTE_HEIGHT,
  lineHeight: `${NOTE_HEIGHT}px`,
  padding: '0 10px',
  fontStyle: 'italic',
  color: '#78909c',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const rowStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  justifyContent: 'space-between',
  gap: 8,
  height: ROW_HEIGHT,
  lineHeight: `${ROW_HEIGHT}px`,
  padding: '0 10px',
  borderTop: '1px solid #eceff1',
  whiteSpace: 'nowrap',
};

const handleStyle: React.CSSProperties = {
  width: 7,
  height: 7,
  background: '#78909c',
  border: 'none',
};

export const TableNode = ({ data }: NodeProps<TableFlowNode>) => (
  <div style={nodeStyle}>
    <div
      style={{
        ...headerStyle,
        ...(data.headerColor ? { background: data.headerColor } : {}),
      }}
      title={data.note}
    >
      {data.label}
    </div>
    {data.note && (
      <div style={noteStyle} title={data.note}>
        {data.note}
      </div>
    )}
    {data.fields.map(field => (
      <div key={field.name} style={rowStyle} title={field.note}>
        <Handle
          type="target"
          position={Position.Left}
          id={`${field.name}-target`}
          style={handleStyle}
          isConnectable={false}
        />
        <span style={{ fontWeight: field.pk ? 700 : 400 }}>
          {field.pk ? `${field.name} [pk]` : field.name}
        </span>
        <span style={{ color: '#78909c' }}>
          {field.type}
          {field.notNull && !field.pk ? ' *' : ''}
        </span>
        <Handle
          type="source"
          position={Position.Right}
          id={`${field.name}-source`}
          style={handleStyle}
          isConnectable={false}
        />
      </div>
    ))}
  </div>
);

export const GroupNode = ({ data }: NodeProps<GroupFlowNode>) => {
  const color = data.color || '#78909c';
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
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
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
