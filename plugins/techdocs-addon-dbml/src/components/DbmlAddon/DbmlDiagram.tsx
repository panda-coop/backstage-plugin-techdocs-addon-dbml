import { useMemo, useState } from 'react';
import { Parser } from '@dbml/core';
import type { Database } from '@dbml/core';
import { DiagramCanvas } from './DiagramCanvas';
import { DiagramDialog } from './DiagramDialog';

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

const frameStyle: React.CSSProperties = {
  border: '1px solid #9e9e9e',
  borderRadius: 4,
  margin: '1em 0',
  overflow: 'hidden',
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 10px',
  borderBottom: '1px solid #e0e0e0',
  fontSize: 13,
};

const expandButtonStyle: React.CSSProperties = {
  border: '1px solid #b0bec5',
  borderRadius: 4,
  background: 'transparent',
  color: 'inherit',
  padding: '2px 10px',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: 13,
};

const summarize = (database: Database): string => {
  const tables = (database.schemas ?? []).flatMap(s => s.tables ?? []).length;
  const refs = (database.schemas ?? []).flatMap(s => s.refs ?? []).length;
  return `${tables} table(s), ${refs} relationship(s)`;
};

export const DbmlDiagram = ({ source }: { source: string }) => {
  const result = useMemo(() => parseDbml(source), [source]);
  const [expanded, setExpanded] = useState(false);

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

  return (
    <div style={frameStyle} data-testid="dbml-diagram">
      <div style={toolbarStyle}>
        <span>{summarize(result.database)}</span>
        <button
          type="button"
          style={expandButtonStyle}
          onClick={() => setExpanded(true)}
        >
          Expand
        </button>
      </div>
      <div style={{ height: 440 }}>
        <DiagramCanvas database={result.database} />
      </div>
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
