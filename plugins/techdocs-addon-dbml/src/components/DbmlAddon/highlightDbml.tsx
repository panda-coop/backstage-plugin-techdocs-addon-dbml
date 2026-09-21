/**
 * Minimal regex-based DBML syntax highlighting producing inline-styled
 * spans — self-contained so it works inside the TechDocs shadow root
 * without pulling in a highlighter dependency.
 */

const TOKEN_RE =
  /(\/\/[^\n]*)|('''[\s\S]*?'''|'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")|(\b(?:Project|Table|TableGroup|Enum|Ref|Note|indexes|as)\b)|(#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?\b)/g;

const tokenStyles: Record<string, React.CSSProperties> = {
  comment: { color: '#90a4ae', fontStyle: 'italic' },
  string: { color: '#2e7d32' },
  keyword: { color: '#1565c0', fontWeight: 600 },
  number: { color: '#d84315' },
};

export function highlightDbml(source: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of source.matchAll(TOKEN_RE)) {
    const index = match.index ?? 0;
    if (index > last) {
      parts.push(source.slice(last, index));
    }
    const [text, comment, string, keyword, number] = match;
    let kind: keyof typeof tokenStyles | undefined;
    if (comment) {
      kind = 'comment';
    } else if (string) {
      kind = 'string';
    } else if (keyword) {
      kind = 'keyword';
    } else if (number) {
      kind = 'number';
    }
    parts.push(
      kind ? (
        <span key={key++} style={tokenStyles[kind]}>
          {text}
        </span>
      ) : (
        text
      ),
    );
    last = index + text.length;
  }
  if (last < source.length) {
    parts.push(source.slice(last));
  }
  return parts;
}
