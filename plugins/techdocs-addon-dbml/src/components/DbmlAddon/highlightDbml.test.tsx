import { isValidElement } from 'react';
import { highlightDbml } from './highlightDbml';
import type { DbmlPalette } from './palette';

const COLORS: DbmlPalette['code'] = {
  comment: 'c-comment',
  string: 'c-string',
  keyword: 'c-keyword',
  type: 'c-type',
  setting: 'c-setting',
  backtick: 'c-backtick',
  operator: 'c-operator',
  color: 'c-color',
};

type Style = { color?: string; fontStyle?: string; fontWeight?: number };

const styleOf = (
  parts: React.ReactNode[],
  text: string,
): Style | undefined => {
  for (const part of parts) {
    if (isValidElement(part) && (part.props as any).children === text) {
      return (part.props as any).style;
    }
  }
  return undefined;
};

const isPlain = (parts: React.ReactNode[], text: string): boolean =>
  parts.some(
    part =>
      (typeof part === 'string' && part.includes(text)) ||
      (isValidElement(part) &&
        (part.props as any).children === text &&
        (part.props as any).style === undefined),
  );

const nodeText = (node: React.ReactNode): string => {
  if (typeof node === 'string') {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map(nodeText).join('');
  }
  if (isValidElement(node)) {
    return nodeText((node.props as any).children);
  }
  return '';
};

const asText = (parts: React.ReactNode[]): string =>
  parts.map(nodeText).join('');

describe('highlightDbml', () => {
  it('preserves the source text exactly', () => {
    const source = [
      'Table users {',
      "  id integer [pk, note: 'identifier']",
      '  name varchar',
      '}',
      '',
      'Ref: posts.user_id > users.id',
    ].join('\n');
    expect(asText(highlightDbml(source, COLORS))).toBe(source);
  });

  it('colors keywords blue without bold, case-insensitively', () => {
    const parts = highlightDbml('Table users {\n}\ntable posts {\n}', COLORS);
    expect(styleOf(parts, 'Table')).toEqual({ color: 'c-keyword' });
    expect(styleOf(parts, 'table')).toEqual({ color: 'c-keyword' });
    expect(styleOf(parts, 'Table')?.fontWeight).toBeUndefined();
  });

  it('leaves table and column names in the default color', () => {
    const parts = highlightDbml('Table users {\n  id integer\n}', COLORS);
    expect(isPlain(parts, 'users')).toBe(true);
    expect(isPlain(parts, 'id')).toBe(true);
  });

  it('colors the second word of a column line as the type', () => {
    const parts = highlightDbml(
      'Table users {\n  id integer\n  status order_status\n}',
      COLORS,
    );
    expect(styleOf(parts, 'integer')).toEqual({ color: 'c-type' });
    expect(styleOf(parts, 'order_status')).toEqual({ color: 'c-type' });
  });

  it('colors parameterized and quoted types as types', () => {
    const parts = highlightDbml(
      'Table t {\n  price decimal(10,2)\n  label "character varying"\n}',
      COLORS,
    );
    expect(styleOf(parts, 'decimal')).toEqual({ color: 'c-type' });
    expect(styleOf(parts, '10')).toEqual({ color: 'c-type' });
    expect(styleOf(parts, '"character varying"')).toEqual({
      color: 'c-type',
    });
  });

  it('does not treat words outside a Table block as types', () => {
    const parts = highlightDbml('Enum status {\n  draft\n  published\n}', COLORS);
    expect(isPlain(parts, 'draft')).toBe(true);
    expect(isPlain(parts, 'published')).toBe(true);
  });

  it('mutes settings inside brackets but keeps strings and colors', () => {
    const parts = highlightDbml(
      "Table t [headerColor: #3498db] {\n  id integer [pk, not null, default: 'x']\n}",
      COLORS,
    );
    expect(styleOf(parts, 'pk')).toEqual({ color: 'c-setting' });
    expect(styleOf(parts, 'not')).toEqual({ color: 'c-setting' });
    expect(styleOf(parts, 'null')).toEqual({ color: 'c-setting' });
    expect(styleOf(parts, "'x'")).toEqual({ color: 'c-string' });
  });

  it('renders a color swatch next to hex color literals', () => {
    const parts = highlightDbml('TableGroup g [color: #3498db] {\n}', COLORS);
    const token = parts.find(
      part => isValidElement(part) && nodeText(part) === '#3498db',
    ) as React.ReactElement | undefined;
    expect(token).toBeDefined();
    expect((token!.props as any).style).toEqual({ color: 'c-color' });
    const [swatch] = (token!.props as any).children;
    expect((swatch.props as any).style.background).toBe('#3498db');
    expect((swatch.props as any).style.width).toBe(10);
  });

  it('colors strings green and comments green italic', () => {
    const parts = highlightDbml(
      "// a comment\nTable t {\n  Note: 'hello'\n}",
      COLORS,
    );
    expect(styleOf(parts, '// a comment')).toEqual({
      color: 'c-comment',
      fontStyle: 'italic',
    });
    expect(styleOf(parts, "'hello'")).toEqual({ color: 'c-string' });
    expect(styleOf(parts, 'Note')).toEqual({ color: 'c-keyword' });
  });

  it('colors backtick expressions purple', () => {
    const parts = highlightDbml(
      'Table t {\n  created_at timestamp [default: `now()`]\n}',
      COLORS,
    );
    expect(styleOf(parts, '`now()`')).toEqual({ color: 'c-backtick' });
  });

  it('colors ref operators only in ref context', () => {
    const parts = highlightDbml(
      'Ref: posts.user_id > users.id\nRef: a.b <> c.d\nTable t {\n  id integer [ref: > u.id]\n}',
      COLORS,
    );
    expect(styleOf(parts, '>')).toEqual({ color: 'c-operator' });
    expect(styleOf(parts, '<>')).toEqual({ color: 'c-operator' });
  });

  it('keeps type highlighting in a table following a single-line Note', () => {
    const parts = highlightDbml(
      [
        'Table customers {',
        '  id integer',
        "  Note: 'People and companies buying from us'",
        '}',
        '',
        'Table addresses {',
        '  line1 varchar [not null]',
        '  country_code char(2) [not null]',
        '}',
      ].join('\n'),
      COLORS,
    );
    expect(styleOf(parts, 'varchar')).toEqual({ color: 'c-type' });
    expect(styleOf(parts, 'char')).toEqual({ color: 'c-type' });
  });

  it('handles multi-line triple-quoted notes as strings', () => {
    const source = "Table t {\n  Note: '''\n    multi line\n  '''\n}";
    const parts = highlightDbml(source, COLORS);
    expect(asText(parts)).toBe(source);
    expect(
      parts.some(
        part =>
          isValidElement(part) &&
          (part.props as any).style?.color === 'c-string' &&
          String((part.props as any).children).includes('multi line'),
      ),
    ).toBe(true);
  });
});
