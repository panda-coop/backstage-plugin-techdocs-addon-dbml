import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Database } from '@dbml/core';
import { DiagramCanvas } from './DiagramCanvas';
import { useDbmlTheme } from './palette';

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
 */
export const DiagramDialog = ({
  title,
  database,
  onClose,
}: {
  title: string;
  database: Database;
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
        aria-label={title}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderBottom: `1px solid ${palette.divider}`,
            fontWeight: 600,
          }}
        >
          <span>{title}</span>
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
        <div style={{ flex: 1, minHeight: 0 }}>
          <DiagramCanvas database={database} wheelZoom />
        </div>
      </div>
    </div>,
    document.body,
  );
};
