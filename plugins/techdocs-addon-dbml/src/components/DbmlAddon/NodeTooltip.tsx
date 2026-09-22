import { useEffect, useRef, useState } from 'react';
import { useDbmlTheme } from './palette';

const ENTER_DELAY_MS = 300;

/**
 * Hand-rolled hover tooltip for diagram nodes. Not MUI Tooltip: its
 * Popper portals to document.body (the only surface that would escape
 * the addon's inline-style theming) and anchoring from inside the
 * scaled React Flow viewport is unreliable. The bubble renders inside
 * the node, so it zooms with the diagram — same behavior as dbdiagram.
 * The enter delay keeps it from flickering while moving across rows.
 */
export const NodeTooltip = ({
  content,
  children,
  style,
}: {
  content?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => {
  const { palette } = useDbmlTheme();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (!content) {
    return <div style={style}>{children}</div>;
  }

  return (
    <div
      style={{ position: 'relative', ...style }}
      onMouseEnter={() => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setOpen(true), ENTER_DELAY_MS);
      }}
      onMouseLeave={() => {
        clearTimeout(timer.current);
        setOpen(false);
      }}
    >
      {children}
      {open && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: 4,
            zIndex: 10,
            pointerEvents: 'none',
            width: 'max-content',
            maxWidth: 260,
            padding: '6px 8px',
            background: palette.frameBg,
            color: palette.text,
            border: `1px solid ${palette.border}`,
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
            fontSize: 11,
            fontWeight: 400,
            lineHeight: 1.4,
            whiteSpace: 'pre-wrap',
            textAlign: 'left',
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};
