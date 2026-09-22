# Reference

## Package exports

| Import | Export | What it is |
|---|---|---|
| `backstage-plugin-techdocs-addon-dbml` | `Dbml` | TechDocs addon component for the classic frontend system (`<TechDocsAddons><Dbml /></TechDocsAddons>`) |
| `backstage-plugin-techdocs-addon-dbml` | `techdocsAddonDbmlPlugin` | The backing Backstage plugin (`id: techdocs-addon-dbml`) |
| `backstage-plugin-techdocs-addon-dbml/alpha` | default | Frontend module for the new frontend system (extension id `addon:techdocs/dbml`) |
| `backstage-plugin-techdocs-addon-dbml/alpha` | `dbmlAddon` | The addon blueprint the module registers |

The addon takes no props and reads no app-config — behavior is fully
determined by the DBML content and the active MUI theme.

## Claimed markup

The addon scans TechDocs content for these candidates and processes the
outermost match:

| Selector | Condition |
|---|---|
| `code.language-dbml`, `pre.dbml`, `.dbml` | Always claimed; parse errors are shown |
| `.highlighttable`, `.highlight` | Claimed only when the block has no declared language (or `text`) **and** the content parses as DBML |

Claimed blocks get `data-dbml-processed="true"`, the original markup is
hidden (not removed), and the widget is portaled in beside it.

## DBML support

| Construct | Rendering |
|---|---|
| `Table`, columns | Node with one row per column; `[pk]` marker, `*` for not null |
| `Table ... [headerColor: #...]` | Colored table header |
| `Ref` with `>`, `<`, `-`, `<>` | Crow's foot edge; many = relation contains `*` (ranges like `0..1` count as one) |
| Composite refs | Anchored on the first column of each side |
| `Enum` + enum-typed column | `E` chip on the column; row tooltip lists values and value notes |
| `TableGroup` | Tinted container; `[color: #...]` or palette cycle by declaration order; collapsible |
| `Note:` / `[note: ...]` on tables, columns, groups | Hover tooltips (note icon on table headers) |
| Multiple schemas | Table labels become `schema.table` |
| `indexes`, table aliases, `[default: ...]`, `[unique]`, sticky notes | Parsed but not rendered (yet) |

## Theming

Colors resolve from the active MUI theme at render time; the static
fallbacks apply outside a theme provider. Key mappings:

| Widget slot | MUI theme source |
|---|---|
| Table header, active toggle (light) | `palette.primary.main` / `contrastText` |
| Surfaces (frame, nodes) | `palette.background.paper` |
| Canvas | `palette.background.default` |
| Text / muted text | `palette.text.primary` / `secondary` |
| Borders, dividers | `palette.divider` |
| Edge hover/selection (light) | `palette.primary.main` |
| Error frame | `palette.error.main` |
| Syntax token colors, group color cycle, dark-theme accents | Fixed per light/dark mode |
