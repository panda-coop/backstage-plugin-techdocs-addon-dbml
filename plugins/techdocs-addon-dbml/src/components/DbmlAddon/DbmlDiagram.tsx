import { useMemo } from 'react';
import { Parser } from '@dbml/core';
import type { Database } from '@dbml/core';

/**
 * Placeholder renderer: parses the DBML source and lists the schema as text.
 * Will be replaced by an interactive React Flow diagram.
 */

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

const boxStyle: React.CSSProperties = {
  border: '1px solid #9e9e9e',
  borderRadius: 4,
  padding: '0.75em 1em',
  margin: '1em 0',
};

export const DbmlDiagram = ({ source }: { source: string }) => {
  const result = useMemo(() => parseDbml(source), [source]);

  if ('error' in result) {
    return (
      <div
        style={{ ...boxStyle, borderColor: '#c62828' }}
        data-testid="dbml-error"
      >
        <strong>DBML parse error</strong>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{result.error}</pre>
      </div>
    );
  }

  const schemas = result.database.schemas ?? [];
  return (
    <div style={boxStyle} data-testid="dbml-diagram">
      <strong>DBML diagram (placeholder renderer)</strong>
      {schemas.map(schema => (
        <div key={schema.name}>
          <ul>
            {schema.tables.map(table => (
              <li key={table.name}>
                <strong>{table.name}</strong>:{' '}
                {table.fields.map(field => field.name).join(', ')}
              </li>
            ))}
          </ul>
          <em>{schema.refs.length} relationship(s)</em>
        </div>
      ))}
    </div>
  );
};
