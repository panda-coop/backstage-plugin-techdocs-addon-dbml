import { useMemo, useState } from 'react';
import { Parser } from '@dbml/core';
import type { Database } from '@dbml/core';
import { DiagramCanvas } from './DiagramCanvas';
import { DiagramDialog } from './DiagramDialog';
import { highlightDbml } from './highlightDbml';
import { useDbmlTheme, type DbmlPalette } from './palette';
import { ViewToggle, type DbmlView } from './ViewToggle';

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

const iconButtonStyle = (palette: DbmlPalette): React.CSSProperties => ({
  border: `1px solid ${palette.buttonBorder}`,
  background: 'transparent',
  color: 'inherit',
  padding: '3px 8px',
  cursor: 'pointer',
  font: 'inherit',
  lineHeight: 0,
});

export const DbmlDiagram = ({ source }: { source: string }) => {
  const result = useMemo(() => parseDbml(source), [source]);
  const [expanded, setExpanded] = useState(false);
  const [view, setView] = useState<DbmlView>('diagram');
  const { palette } = useDbmlTheme();

  // Explicit background and text colors: the frame lives in the TechDocs
  // shadow DOM and must not inherit the page styles.
  const frameStyle: React.CSSProperties = {
    border: `1px solid ${palette.border}`,
    borderRadius: 4,
    margin: '1em 0',
    overflow: 'hidden',
    background: palette.frameBg,
    color: palette.text,
  };

  if ('error' in result) {
    return (
      <div
        style={{
          ...frameStyle,
          borderColor: palette.errorBorder,
          padding: '0.75em 1em',
        }}
        data-testid="dbml-error"
      >
        <strong>DBML parse error</strong>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{result.error}</pre>
      </div>
    );
  }

  return (
    <div style={frameStyle} data-testid="dbml-diagram">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          borderBottom: `1px solid ${palette.divider}`,
          fontSize: 13,
        }}
      >
        <ViewToggle view={view} onChange={setView} palette={palette} />
        <button
          type="button"
          style={{ ...iconButtonStyle(palette), borderRadius: 4 }}
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
          <code>{highlightDbml(source.trim(), palette.code)}</code>
        </pre>
      )}
      <div
        style={{
          padding: '4px 10px',
          borderTop: `1px solid ${palette.divider}`,
          fontSize: 12,
          color: palette.muted,
        }}
      >
        {summarize(result.database)}
      </div>
      {expanded && (
        <DiagramDialog
          summary={summarize(result.database)}
          database={result.database}
          source={source}
          view={view}
          onViewChange={setView}
          onClose={() => setExpanded(false)}
        />
      )}
    </div>
  );
};
