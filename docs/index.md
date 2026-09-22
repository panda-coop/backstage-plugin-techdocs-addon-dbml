# backstage-plugin-techdocs-addon-dbml

A Backstage TechDocs addon that replaces `dbml` code fences in TechDocs
pages with interactive entity-relationship diagrams. Parsing is done
with [`@dbml/core`](https://www.dbml.org/), rendering with React Flow.

| Capability | Notes |
|---|---|
| Interactive diagram | Draggable tables, pan/zoom, auto-layout (dagre) |
| Crow's foot edges | Cardinality derived from the `Ref` operator |
| Table groups | `TableGroup` renders as tinted containers with collapse |
| Collapsible tables | Chevron in the table header |
| Code view | Context-aware DBML syntax highlighting |
| Expand dialog | Near-fullscreen modal sharing the diagram/code view |
| Theming | Colors resolve from the active Backstage MUI theme |

Where to go next:

- [Installation](installation.md) — add the package to your app.
- [Usage](usage.md) — wire the addon into the new or classic frontend system.
- [Authoring](authoring.md) — how DBML blocks in TechDocs pages are detected.
- [Features](features.md) — what the rendered diagram can do.
- [Reference](reference.md) — package exports, claimed markup, DBML
  support matrix, theming.
- [Examples](example/index.md) — live sample pages (these also serve as the
  development fixture for this repo).
