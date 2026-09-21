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

TechDocs' default highlighter renders unknown fence languages as plain
highlighted text without a usable class, so each mkdocs site must declare a
custom fence for the addon to find the blocks:

```yaml
markdown_extensions:
  - pymdownx.superfences:
      custom_fences:
        - name: dbml
          class: dbml
          format: !!python/name:pymdownx.superfences.fence_code_format
```

## License

GPL-3.0-or-later. Copyright (C) 2026 PANDA Coop.
