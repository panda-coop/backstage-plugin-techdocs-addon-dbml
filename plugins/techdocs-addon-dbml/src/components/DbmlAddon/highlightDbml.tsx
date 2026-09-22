import { PALETTES, type DbmlPalette } from './palette';

/**
 * Context-aware line-based DBML syntax highlighting producing inline-styled
 * spans — self-contained so it works inside the TechDocs shadow root
 * without pulling in a highlighter dependency.
 *
 * Tokenization runs per line with a small cross-line state (open block
 * stack, unterminated triple-quoted string) so column types can be
 * recognized positionally: inside a `Table { }` block the second word on
 * a field line is the type, like dbdiagram.io renders it.
 */

type TokenKind =
  | 'comment'
  | 'string'
  | 'keyword'
  | 'type'
  | 'setting'
  | 'backtick'
  | 'operator'
  | 'color'
  | 'plain';

type Token = { text: string; kind: TokenKind; start: number };

type Block = 'project' | 'table' | 'tablegroup' | 'enum' | 'ref' | 'other';

type ScanState = { stack: Block[]; inTriple: boolean; pendingBlock?: Block };

const BLOCK_KEYWORDS: Record<string, Block> = {
  project: 'project',
  table: 'table',
  tablegroup: 'tablegroup',
  enum: 'enum',
  ref: 'ref',
  note: 'other',
  indexes: 'other',
};

const KEYWORDS = new Set([
  'project',
  'table',
  'tablegroup',
  'enum',
  'ref',
  'note',
  'indexes',
  'as',
]);

// Keywords that also start lines inside a Table block (unlike column names).
const TABLE_INNER_KEYWORDS = new Set(['note', 'indexes']);

const LINE_TOKEN_RE =
  /(\/\/.*)|(''')|('(?:[^'\\]|\\.)*')|("(?:[^"\\]|\\.)*")|(`[^`]*`)|(#[0-9a-fA-F]{3,8}\b)|(<>|[<>-])|([A-Za-z_][A-Za-z0-9_]*)|(\d+(?:\.\d+)?)|([[\]{}():,.])|(\S)/g;

const isWordLike = (t: Token): boolean =>
  t.kind === 'plain' || t.kind === 'string';

function rawTokens(line: string, state: ScanState): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  const pushString = (text: string, start: number) =>
    tokens.push({ text, kind: 'string', start });

  // Continuation of a multi-line ''' string.
  if (state.inTriple) {
    const close = line.indexOf("'''");
    if (close === -1) {
      if (line) {
        pushString(line, 0);
      }
      return tokens;
    }
    pushString(line.slice(0, close + 3), 0);
    state.inTriple = false;
    pos = close + 3;
  }

  LINE_TOKEN_RE.lastIndex = pos;
  for (let m = LINE_TOKEN_RE.exec(line); m; m = LINE_TOKEN_RE.exec(line)) {
    const start = m.index;
    const [
      text,
      comment,
      tripleOpen,
      sstring,
      dstring,
      backtick,
      hexColor,
      operator,
      word,
    ] = m;
    if (comment) {
      tokens.push({ text, kind: 'comment', start });
      break;
    }
    if (tripleOpen) {
      const close = line.indexOf("'''", start + 3);
      if (close === -1) {
        pushString(line.slice(start), start);
        state.inTriple = true;
        break;
      }
      pushString(line.slice(start, close + 3), start);
      LINE_TOKEN_RE.lastIndex = close + 3;
      continue;
    }
    let kind: TokenKind = 'plain';
    if (sstring || dstring) {
      kind = 'string';
    } else if (backtick) {
      kind = 'backtick';
    } else if (hexColor) {
      kind = 'color';
    } else if (operator) {
      kind = 'operator';
    } else if (word) {
      kind = 'plain';
    }
    tokens.push({ text, kind, start });
  }
  return tokens;
}

const isWord = (t: Token): boolean => /^[A-Za-z_]/.test(t.text);

/**
 * Contextual reclassification of one line's raw tokens, mutating kinds in
 * place, and block-stack bookkeeping for the following lines.
 */
function classifyLine(tokens: Token[], state: ScanState): void {
  const top = state.stack[state.stack.length - 1];
  const firstWordIdx = tokens.findIndex(
    t => t.kind === 'plain' && isWord(t),
  );
  const firstWord =
    firstWordIdx === -1 ? undefined : tokens[firstWordIdx].text.toLowerCase();

  // Keyword positions: the leading word of a statement line. Inside a
  // Table block the leading word is a column name, except Note/Indexes.
  let lineIsKeywordLed = false;
  if (firstWord && KEYWORDS.has(firstWord)) {
    lineIsKeywordLed =
      top === 'table' || top === 'enum'
        ? TABLE_INNER_KEYWORDS.has(firstWord)
        : true;
    if (lineIsKeywordLed) {
      tokens[firstWordIdx].kind = 'keyword';
    }
  }

  // `as` (table alias) is a keyword anywhere outside brackets.
  // Ref operators are only operators in ref context; elsewhere (a stray
  // `-` or `<` in prose) they stay plain unless inside settings brackets.
  const refContext =
    top === 'ref' || (lineIsKeywordLed && firstWord === 'ref');

  let bracketDepth = 0;
  for (const t of tokens) {
    if (t.text === '[') {
      bracketDepth += 1;
      t.kind = 'setting';
      continue;
    }
    if (t.text === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      t.kind = 'setting';
      continue;
    }
    if (bracketDepth > 0) {
      if (t.kind === 'operator') {
        continue; // ref: > … inside settings keeps operator color
      }
      if (t.kind === 'plain') {
        t.kind = 'setting';
      }
      continue;
    }
    if (t.kind === 'operator' && !refContext) {
      t.kind = 'plain';
    }
    if (t.kind === 'plain' && isWord(t) && t.text.toLowerCase() === 'as') {
      t.kind = 'keyword';
    }
  }

  // Column type: inside a Table block, on a column line (not keyword-led),
  // the second word-like token is the type — plus any contiguous run
  // following it, so `decimal(10,2)` colors as one unit.
  if (top === 'table' && !lineIsKeywordLed) {
    const meaningful = tokens.filter(
      t => isWordLike(t) && t.text !== '{' && t.text !== '}',
    );
    const column = meaningful[0];
    const type = meaningful[1];
    if (column && type && (isWord(type) || type.kind === 'string')) {
      type.kind = 'type';
      let end = type.start + type.text.length;
      for (const t of tokens) {
        if (t.start === end && (t.kind === 'plain' || t.kind === 'setting')) {
          if (t.text === '[') {
            break;
          }
          t.kind = 'type';
          end += t.text.length;
        }
      }
    }
  }

  // Block bookkeeping for subsequent lines.
  for (const t of tokens) {
    if (t.kind !== 'plain' && t.kind !== 'keyword' && t.kind !== 'setting') {
      continue;
    }
    if (t.text === '{') {
      const opened =
        lineIsKeywordLed && firstWord ? BLOCK_KEYWORDS[firstWord] : undefined;
      state.stack.push(state.pendingBlock ?? opened ?? 'other');
      state.pendingBlock = undefined;
    } else if (t.text === '}') {
      state.stack.pop();
    }
  }
  if (
    lineIsKeywordLed &&
    firstWord &&
    BLOCK_KEYWORDS[firstWord] &&
    !tokens.some(t => t.text === '{')
  ) {
    // `Table foo` with the `{` on the next line.
    state.pendingBlock = BLOCK_KEYWORDS[firstWord];
  }
}

const tokenStyles = (
  colors: DbmlPalette['code'],
): Partial<Record<TokenKind, React.CSSProperties>> => ({
  comment: { color: colors.comment, fontStyle: 'italic' },
  string: { color: colors.string },
  keyword: { color: colors.keyword },
  type: { color: colors.type },
  setting: { color: colors.setting },
  backtick: { color: colors.backtick },
  operator: { color: colors.operator },
  color: { color: colors.color },
});

export function highlightDbml(
  source: string,
  colors: DbmlPalette['code'] = PALETTES.light.code,
): React.ReactNode[] {
  const styles = tokenStyles(colors);
  const state: ScanState = { stack: [], inTriple: false };
  const parts: React.ReactNode[] = [];
  let key = 0;
  const lines = source.split('\n');
  lines.forEach((line, lineIdx) => {
    const startedInTriple = state.inTriple;
    const tokens = rawTokens(line, state);
    if (!startedInTriple) {
      classifyLine(tokens, state);
    }
    let last = 0;
    for (const t of tokens) {
      if (t.start > last) {
        parts.push(line.slice(last, t.start));
      }
      const style = styles[t.kind];
      parts.push(
        style ? (
          <span key={key++} style={style}>
            {t.text}
          </span>
        ) : (
          t.text
        ),
      );
      last = t.start + t.text.length;
    }
    if (last < line.length) {
      parts.push(line.slice(last));
    }
    if (lineIdx < lines.length - 1) {
      parts.push('\n');
    }
  });
  return parts;
}
