import { useMemo, useState } from 'react';
import { Parser } from '@dbml/core';
import type { Database } from '@dbml/core';
import { DiagramCanvas } from './DiagramCanvas';
import { DiagramDialog } from './DiagramDialog';
import { highlightDbml } from './highlightDbml';

type ParseResult = { database: Database } | { error: string };

function parseDbml(source: string): ParseResult {
  try {
    return { database: Parser.parse(source, 'dbmlv2') };
  } catch (error) {
    const diags = (error as { diags?: Array<{ message: string }> }).diags;
    if (diags?.length) {
      return { error: diags.map(d => d.message).join('\n') };
    }
    return {
      error: error instanceof Error ? error.message : JSON.stringify(error),
    };
  }
}

// Explicit background and text colors: the frame lives in the TechDocs
// shadow DOM and must not inherit the page theme — the canvas and node
// palette are light, so the chrome is pinned light too.
const frameStyle: React.CSSProperties = {
  border: '1px solid #9e9e9e',
  borderRadius: 4,
  margin: '1em 0',
  overflow: 'hidden',
  background: '#ffffff',
  color: '#263238',
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 10px',
  borderBottom: '1px solid #e0e0e0',
  fontSize: 13,
};

const buttonStyle: React.CSSProperties = {
  border: '1px solid #b0bec5',
  background: 'transparent',
  color: 'inherit',
  padding: '2px 10px',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: 13,
};

const footerStyle: React.CSSProperties = {
  padding: '4px 10px',
  borderTop: '1px solid #e0e0e0',
  fontSize: 12,
  color: '#78909c',
};

const ExpandIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);

const summarize = (database: Database): string => {
  const tables = (database.schemas ?? []).flatMap(s => s.tables ?? []).length;
  const refs = (database.schemas ?? []).flatMap(s => s.refs ?? []).length;
  const tablesLabel = tables === 1 ? 'table' : 'tables';
  const refsLabel = refs === 1 ? 'relationship' : 'relationships';
  return `${tables} ${tablesLabel} · ${refs} ${refsLabel}`;
};

export const DbmlDiagram = ({ source }: { source: string }) => {
  const result = useMemo(() => parseDbml(source), [source]);
  const [expanded, setExpanded] = useState(false);
  const [view, setView] = useState<'diagram' | 'code'>('diagram');

  if ('error' in result) {
    return (
      <div
        style={{
          ...frameStyle,
          borderColor: '#c62828',
          padding: '0.75em 1em',
        }}
        data-testid="dbml-error"
      >
        <strong>DBML parse error</strong>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{result.error}</pre>
      </div>
    );
  }

  const viewButton = (target: 'diagram' | 'code', label: string) => (
    <button
      type="button"
      style={{
        ...buttonStyle,
        ...(view === target
          ? { background: '#37474f', color: '#ffffff', borderColor: '#37474f' }
          : {}),
        ...(target === 'diagram'
          ? { borderRadius: '4px 0 0 4px' }
          : { borderRadius: '0 4px 4px 0', marginLeft: -1 }),
      }}
      aria-pressed={view === target}
      onClick={() => setView(target)}
    >
      {label}
    </button>
  );

  return (
    <div style={frameStyle} data-testid="dbml-diagram">
      <div style={toolbarStyle}>
        <span>
          {viewButton('diagram', 'Diagram')}
          {viewButton('code', 'Code')}
        </span>
        <button
          type="button"
          style={{ ...buttonStyle, borderRadius: 4, padding: '3px 8px' }}
          aria-label="Expand diagram"
          title="Expand diagram"
          onClick={() => setExpanded(true)}
        >
          <ExpandIcon />
        </button>
      </div>
      {view === 'diagram' ? (
        <div style={{ height: 440 }}>
          <DiagramCanvas database={result.database} />
        </div>
      ) : (
        <pre
          style={{
            margin: 0,
            padding: '0.75em 1em',
            maxHeight: 440,
            overflow: 'auto',
          }}
          data-testid="dbml-source"
        >
          <code>{highlightDbml(source.trim())}</code>
        </pre>
      )}
      <div style={footerStyle}>{summarize(result.database)}</div>
      {expanded && (
        <DiagramDialog
          title={summarize(result.database)}
          database={result.database}
          onClose={() => setExpanded(false)}
        />
      )}
    </div>
  );
};
