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
 * Collapse toggling lives in DiagramCanvas (it owns the collapsed set and
 * the derived nodes/edges); a context keeps the callback out of node
 * data, so node objects stay serializable and memo-friendly.
 */
export const GroupCollapseContext = createContext<(groupId: string) => void>(
  () => {},
);

const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

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
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="11" x2="12" y2="17" />
    <line x1="12" y1="7" x2="12" y2="7.5" />
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
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)',
      }}
    >
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
          // the header rounds its own top corners.
          borderRadius: '5px 5px 0 0',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {data.label}
        </span>
        {data.note && <NoteIcon />}
      </NodeTooltip>
      {data.fields.map(field => (
        <NodeTooltip
          key={field.name}
          content={field.note}
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
              <NodeTooltip
                content={enumTip(field.enum)}
                style={{ display: 'inline-flex' }}
              >
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
              </NodeTooltip>
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
