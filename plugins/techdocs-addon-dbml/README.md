# backstage-plugin-techdocs-addon-dbml

Backstage TechDocs addon that replaces `dbml` code fences in TechDocs pages
with rendered DBML diagrams. Parsing is done with
[`@dbml/core`](https://www.dbml.org/); the current renderer is a placeholder
listing tables and relationships — the interactive diagram renderer is in
progress.

## Usage

### New frontend system

Add the package to your app's dependencies. With package discovery enabled
(`app.packages: all`) nothing else is needed; otherwise add the plugin to
`createApp`:

```tsx
import techdocsAddonDbml from 'backstage-plugin-techdocs-addon-dbml/alpha';

export default createApp({
  features: [techdocsAddonDbml],
});
```

### Classic frontend system

Register the addon on the TechDocs reader and entity pages:

```tsx
import { Dbml } from 'backstage-plugin-techdocs-addon-dbml';

<TechDocsReaderPage>
  <TechDocsAddons>
    <Dbml />
  </TechDocsAddons>
</TechDocsReaderPage>;
```

## Authoring docs

Use a fenced code block with the `dbml` language in any TechDocs page:

````markdown
```dbml
Table users {
  id integer [primary key]
}
```
````

TechDocs' highlighter has no DBML lexer and renders the fence as generic
highlighted text, losing the language. The addon therefore content-sniffs
undeclared and `text` highlight blocks, claiming only ones that parse as
DBML — no mkdocs configuration is needed, but a broken DBML block stays a
plain code block instead of showing a parse error. Blocks explicitly marked
as DBML (`code.language-dbml` or `pre.dbml`, e.g. from other markdown
renderers) are always claimed and do show parse errors.

## License

GPL-3.0-or-later. Copyright (C) 2026 PANDA Coop.
