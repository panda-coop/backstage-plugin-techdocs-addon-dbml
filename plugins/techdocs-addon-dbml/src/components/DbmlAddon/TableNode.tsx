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
import { NodeTooltip } from './NodeTooltip';
import type { FieldEnum } from './dbmlToFlow';

/**
 * Collapse toggling lives in DiagramCanvas (it owns the collapsed sets
 * and the derived nodes/edges); a context keeps the callback out of node
 * data, so node objects stay serializable and memo-friendly. Both
 * GroupNode and TableNode hand back their node id; the canvas dispatches
 * on node type.
 */
export const CollapseContext = createContext<(nodeId: string) => void>(
  () => {},
);

const chevronButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
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

const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// A note sheet: rounded page with two text lines.
const NoteIcon = () => (
  <svg
    width={12}
    height={12}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    aria-hidden
    style={{ flexShrink: 0, opacity: 0.85 }}
  >
    <rect x="5" y="4" width="14" height="16" rx="2" />
    <line x1="9" y1="9" x2="15" y2="9" />
    <line x1="9" y1="13" x2="15" y2="13" />
  </svg>
);

const enumTip = (fieldEnum: FieldEnum) => (
  <span>
    <span style={{ display: 'block', fontWeight: 600 }}>{fieldEnum.name}</span>
    {fieldEnum.values.map(value => (
      <span key={value.name} style={{ display: 'block' }}>
        {value.name}
        {value.note ? ` — ${value.note}` : ''}
      </span>
    ))}
  </span>
);

// Hovering the row surfaces everything about the column: its note, its
// enum values, or both.
const rowTip = (field: {
  note?: string;
  enum?: FieldEnum;
}): React.ReactNode | undefined => {
  if (!field.note && !field.enum) {
    return undefined;
  }
  return (
    <span>
      {field.note && <span style={{ display: 'block' }}>{field.note}</span>}
      {field.enum && (
        <span style={{ display: 'block', marginTop: field.note ? 4 : 0 }}>
          {enumTip(field.enum)}
        </span>
      )}
    </span>
  );
};

export const TableNode = ({ id, data }: NodeProps<TableFlowNode>) => {
  const { palette } = useDbmlTheme();
  const toggle = useContext(CollapseContext);
  const collapsed = Boolean(data.collapsed);

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
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Anchors for edges re-pointed to a collapsed table; hidden like
          all handles, centered on the header row. */}
      <Handle
        type="target"
        position={Position.Left}
        id="table-target"
        style={{ top: HEADER_HEIGHT / 2 }}
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="table-source"
        style={{ top: HEADER_HEIGHT / 2 }}
        isConnectable={false}
      />
      <NodeTooltip
        content={data.note}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          height: HEADER_HEIGHT,
          padding: '0 10px',
          background: data.headerColor || palette.header,
          color: palette.headerText,
          fontWeight: 600,
          // The root no longer clips (overflow would cut off tooltips), so
          // the header rounds its own corners (all four when collapsed).
          borderRadius: collapsed ? 5 : '5px 5px 0 0',
        }}
      >
        <button
          type="button"
          className="nopan"
          aria-label={collapsed ? 'Expand table' : 'Collapse table'}
          aria-expanded={!collapsed}
          onClick={event => {
            event.stopPropagation();
            toggle(id);
          }}
          style={chevronButtonStyle}
        >
          <ChevronIcon collapsed={collapsed} />
        </button>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {data.label}
        </span>
        {data.note && <NoteIcon />}
      </NodeTooltip>
      {!collapsed &&
        data.fields.map(field => (
        <NodeTooltip
          key={field.name}
          content={rowTip(field)}
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            height: ROW_HEIGHT,
            padding: '0 10px',
            borderTop: `1px solid ${palette.rowBorder}`,
            whiteSpace: 'nowrap',
          }}
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
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              color: palette.muted,
            }}
          >
            {field.type}
            {field.notNull && !field.pk ? ' *' : ''}
            {field.enum && (
              <span
                aria-label={`enum ${field.enum.name}`}
                style={{
                  display: 'inline-block',
                  padding: '0 3px',
                  fontSize: 9,
                  lineHeight: '12px',
                  fontWeight: 700,
                  border: `1px solid ${palette.muted}`,
                  borderRadius: 3,
                }}
              >
                E
              </span>
            )}
          </span>
          <Handle
            type="source"
            position={Position.Right}
            id={`${field.name}-source`}
            isConnectable={false}
          />
        </NodeTooltip>
      ))}
    </div>
  );
};

export const GroupNode = ({ id, data }: NodeProps<GroupFlowNode>) => {
  const { mode } = useDbmlTheme();
  const toggle = useContext(CollapseContext);
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
    >
      <NodeTooltip
        content={data.note}
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
          style={chevronButtonStyle}
        >
          <ChevronIcon collapsed={collapsed} />
        </button>
        <span
          style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {data.label}
        </span>
      </NodeTooltip>
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
