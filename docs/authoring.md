# Authoring

Use a fenced code block with the `dbml` language in any TechDocs page:

````markdown
```dbml
Table users {
  id integer [primary key]
}
```
````

## How blocks are detected

TechDocs' highlighter has no DBML lexer and renders the fence as generic
highlighted text, losing the language. The addon therefore content-sniffs
undeclared and `text` highlight blocks, claiming only ones that parse as
DBML. No mkdocs configuration is needed.

| Block kind | Claimed | Parse errors shown |
|---|---|---|
| Undeclared / `text` highlight block that parses as DBML | yes | no — a broken block stays a plain code block |
| `code.language-dbml` or `pre.dbml` (other markdown renderers) | always | yes |
| Any other declared language | never | — |

A claimed block is replaced in place by the interactive widget; the
original markup stays in the DOM (hidden), so copy-from-source
workflows and non-JS consumers are unaffected.

## What renders well

Everything `@dbml/core` parses is accepted. The diagram understands
tables, refs (`>`, `<`, `-`, `<>` cardinality), `TableGroup` (with or
without `[color: #...]`), `headerColor`, enums (columns typed with a
declared enum get a chip listing the values), and table, column and
group notes (shown as hover tooltips). See the
[examples](example/index.md) for full pages.
