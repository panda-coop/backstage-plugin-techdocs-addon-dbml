import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Database } from '@dbml/core';
import { DiagramCanvas } from './DiagramCanvas';

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 2000,
  background: 'rgba(0, 0, 0, 0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const panelStyle: React.CSSProperties = {
  width: 'min(94vw, 1600px)',
  height: '88vh',
  display: 'flex',
  flexDirection: 'column',
  background: '#ffffff',
  color: '#263238',
  borderRadius: 8,
  overflow: 'hidden',
  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.4)',
};

const titleBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 16px',
  borderBottom: '1px solid #eceff1',
  fontWeight: 600,
};

const closeButtonStyle: React.CSSProperties = {
  border: '1px solid #b0bec5',
  borderRadius: 4,
  background: 'transparent',
  color: 'inherit',
  padding: '4px 12px',
  cursor: 'pointer',
  font: 'inherit',
};

/**
 * Plain fixed-overlay dialog portaled to document.body — deliberately not a
 * MUI Dialog: the addon mounts inside the TechDocs shadow root where MUI's
 * head-injected styles do not apply, and a hand-rolled overlay keeps the
 * plugin free of a @material-ui peer dependency.
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
      <div style={panelStyle} role="dialog" aria-label={title}>
        <div style={titleBarStyle}>
          <span>{title}</span>
          <button type="button" style={closeButtonStyle} onClick={onClose}>
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
