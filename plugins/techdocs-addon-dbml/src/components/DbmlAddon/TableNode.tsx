import { createContext, useContext } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  GROUP_LABEL_HEIGHT,
  HEADER_HEIGHT,
  NODE_WIDTH,
  ROW_HEIGHT,
  type GroupFlowNode,
  type TableFlowNode,
} from './dbmlToFlow';
import { GROUP_COLORS, useDbmlTheme } from './palette';

/**
 * Collapse toggling lives in DiagramCanvas (it owns the collapsed set and
 * the derived nodes/edges); a context keeps the callback out of node
 * data, so node objects stay serializable and memo-friendly.
 */
export const GroupCollapseContext = createContext<(groupId: string) => void>(
  () => {},
);

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

const ChevronIcon = ({ collapsed }: { collapsed: boolean }) => (
  <svg
    width={12}
    height={12}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    style={{
      transform: collapsed ? 'rotate(-90deg)' : 'none',
      transition: 'transform 150ms ease',
    }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const GroupNode = ({ id, data }: NodeProps<GroupFlowNode>) => {
  const { mode } = useDbmlTheme();
  const toggle = useContext(GroupCollapseContext);
  const cycle = GROUP_COLORS[mode];
  const color = data.color || cycle[data.colorIndex % cycle.length];
  const collapsed = Boolean(data.collapsed);
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
        borderRadius: 8,
        background: `color-mix(in srgb, ${color} 9%, transparent)`,
      }}
      title={data.note}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          height: GROUP_LABEL_HEIGHT,
          padding: '0 8px',
          fontFamily: mono,
          fontSize: 12,
          fontWeight: 600,
          color,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        <button
          type="button"
          className="nopan"
          aria-label={collapsed ? 'Expand group' : 'Collapse group'}
          aria-expanded={!collapsed}
          onClick={event => {
            event.stopPropagation();
            toggle(id);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: 0,
            border: 'none',
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
          }}
        >
          <ChevronIcon collapsed={collapsed} />
        </button>
        <span>{data.label}</span>
      </div>
      {/* Anchors for edges re-pointed to a collapsed group; hidden like all
          handles, centered on the header row. */}
      <Handle
        type="target"
        position={Position.Left}
        id="group-target"
        style={{ top: GROUP_LABEL_HEIGHT / 2 }}
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="group-source"
        style={{ top: GROUP_LABEL_HEIGHT / 2 }}
        isConnectable={false}
      />
    </div>
  );
};
