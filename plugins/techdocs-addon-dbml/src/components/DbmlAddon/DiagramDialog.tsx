import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Database } from '@dbml/core';
import { DiagramCanvas } from './DiagramCanvas';
import { highlightDbml } from './highlightDbml';
import { useDbmlTheme } from './palette';
import { ViewToggle, type DbmlView } from './ViewToggle';

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 2000,
  background: 'rgba(0, 0, 0, 0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

/**
 * Plain fixed-overlay dialog portaled to document.body — deliberately not a
 * MUI Dialog: the addon mounts inside the TechDocs shadow root where MUI's
 * head-injected styles do not apply, so the overlay is styled inline.
 *
 * The diagram/code view is owned by the inline block (DbmlDiagram) and
 * passed down, so the modal opens in whatever view is active inline and
 * switching in either place stays in sync.
 */
export const DiagramDialog = ({
  summary,
  database,
  source,
  view,
  onViewChange,
  onClose,
}: {
  summary: string;
  database: Database;
  source: string;
  view: DbmlView;
  onViewChange: (view: DbmlView) => void;
  onClose: () => void;
}) => {
  const { palette } = useDbmlTheme();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      style={overlayStyle}
      data-testid="dbml-dialog"
      role="presentation"
      onClick={event => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: 'min(94vw, 1600px)',
          height: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: palette.frameBg,
          color: palette.text,
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.4)',
        }}
        role="dialog"
        aria-label={summary}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: '10px 16px',
            borderBottom: `1px solid ${palette.divider}`,
          }}
        >
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 16 }}
          >
            <ViewToggle view={view} onChange={onViewChange} palette={palette} />
            <span style={{ fontSize: 13, color: palette.muted }}>
              {summary}
            </span>
          </span>
          <button
            type="button"
            style={{
              border: `1px solid ${palette.buttonBorder}`,
              borderRadius: 4,
              background: 'transparent',
              color: 'inherit',
              padding: '4px 12px',
              cursor: 'pointer',
              font: 'inherit',
            }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          {view === 'diagram' ? (
            <div style={{ flex: 1, minWidth: 0 }}>
              <DiagramCanvas database={database} wheelZoom />
            </div>
          ) : (
            <pre
              style={{
                flex: 1,
                minWidth: 0,
                margin: 0,
                padding: '0.75em 1em',
                overflow: 'auto',
              }}
              data-testid="dbml-dialog-source"
            >
              <code style={{ padding: 0, background: 'transparent' }}>
                {highlightDbml(source.trim(), palette.code)}
              </code>
            </pre>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
