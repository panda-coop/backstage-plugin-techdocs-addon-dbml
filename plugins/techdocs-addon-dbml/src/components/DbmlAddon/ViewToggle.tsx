import type { DbmlPalette } from './palette';

export type DbmlView = 'diagram' | 'code';

const SEGMENT_WIDTH = 30;
const SEGMENT_HEIGHT = 24;
const SEGMENT_GAP = 4;

// Sitemap/hierarchy glyph rotated to flow left-to-right: a parent square
// on the left, two child squares stacked on the right, joined by a stem
// into a rounded-corner vertical bar.
const DiagramIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <rect x="2.5" y="9" width="6" height="6" rx="1.75" fill="currentColor" />
    <rect x="15.5" y="2.5" width="6" height="6" rx="1.75" fill="currentColor" />
    <rect x="15.5" y="15.5" width="6" height="6" rx="1.75" fill="currentColor" />
    <path
      d="M8.5 12H12M15.5 5.5h-2a1.5 1.5 0 0 0-1.5 1.5v10a1.5 1.5 0 0 0 1.5 1.5h2"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

// </> rather than <>, stroke style matching the diagram icon.
const CodeIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m8 17-5-5 5-5" />
    <path d="m16 7 5 5-5 5" />
    <line x1="13.25" y1="4.5" x2="10.75" y2="19.5" />
  </svg>
);

/**
 * Segmented diagram/code control: borderless icon buttons with a filled
 * pill that slides to the active one. Shared by the inline header and
 * the modal header so both render the exact same switch.
 */
export const ViewToggle = ({
  view,
  onChange,
  palette,
}: {
  view: DbmlView;
  onChange: (view: DbmlView) => void;
  palette: DbmlPalette;
}) => {
  const viewButton = (
    target: DbmlView,
    label: string,
    icon: React.ReactNode,
  ) => (
    <button
      type="button"
      style={{
        position: 'relative',
        width: SEGMENT_WIDTH,
        height: SEGMENT_HEIGHT,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        borderRadius: 4,
        background: 'transparent',
        padding: 0,
        cursor: 'pointer',
        font: 'inherit',
        color: view === target ? palette.activeText : palette.muted,
        transition: 'color 150ms ease',
      }}
      aria-pressed={view === target}
      aria-label={label}
      title={label}
      onClick={() => onChange(target)}
    >
      {icon}
    </button>
  );

  return (
    <span
      role="group"
      aria-label="View"
      style={{
        position: 'relative',
        display: 'inline-flex',
        gap: SEGMENT_GAP,
        padding: 3,
        border: `1px solid ${palette.divider}`,
        borderRadius: 6,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 3,
          left: 3,
          width: SEGMENT_WIDTH,
          height: SEGMENT_HEIGHT,
          borderRadius: 4,
          background: palette.activeBg,
          transform:
            view === 'diagram'
              ? 'translateX(0)'
              : `translateX(${SEGMENT_WIDTH + SEGMENT_GAP}px)`,
          transition: 'transform 150ms ease',
        }}
      />
      {viewButton('diagram', 'Diagram view', <DiagramIcon />)}
      {viewButton('code', 'Code view', <CodeIcon />)}
    </span>
  );
};
