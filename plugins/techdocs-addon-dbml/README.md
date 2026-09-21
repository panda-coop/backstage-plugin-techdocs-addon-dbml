# backstage-plugin-techdocs-addon-dbml

Backstage TechDocs addon that replaces `dbml` code fences in TechDocs pages
with interactive entity-relationship diagrams. Parsing is done with
[`@dbml/core`](https://www.dbml.org/), rendering with React Flow: tables are
draggable nodes with per-field connection points, relationships are
field-anchored edges, and the graph is auto-laid-out. The inline diagram
supports pan and zoom, and an Expand button opens it in a near-fullscreen
dialog.

## Usage

### New frontend system

Add the package to your app's dependencies. With package discovery enabled
(`app.packages: all`) nothing else is needed; otherwise add the module to
`createApp`:

```tsx
import techdocsAddonDbml from 'backstage-plugin-techdocs-addon-dbml/alpha';

export default createApp({
  features: [techdocsAddonDbml],
});
```

**Known upstream limitation:** as of `@backstage/plugin-techdocs` 1.18.1 the
new frontend system registers addons but never renders them — the reader's
element filter cannot see through the internal `Addons` component boundary,
so every addon (this one and the `techdocs-module-addons-contrib` ones) is
silently dropped. Until that is fixed upstream, override the entity Docs tab
with the classic wiring:

```tsx
import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { EntityContentBlueprint } from '@backstage/plugin-catalog-react/alpha';
import { convertLegacyRouteRef } from '@backstage/core-compat-api';
import { techdocsPlugin } from '@backstage/plugin-techdocs';

const docsContent = EntityContentBlueprint.make({
  params: {
    path: 'docs',
    title: 'TechDocs',
    routeRef: convertLegacyRouteRef(techdocsPlugin.routes.entityContent),
    loader: async () => {
      const [{ EmbeddedDocsRouter }, { TechDocsAddons }, { Dbml }] =
        await Promise.all([
          import('@backstage/plugin-techdocs'),
          import('@backstage/plugin-techdocs-react'),
          import('backstage-plugin-techdocs-addon-dbml'),
        ]);
      return (
        <EmbeddedDocsRouter>
          <TechDocsAddons>
            <Dbml />
          </TechDocsAddons>
        </EmbeddedDocsRouter>
      );
    },
  },
});

export const techdocsDbmlModule = createFrontendModule({
  pluginId: 'techdocs',
  extensions: [docsContent],
});
```

This repo's dev app (`packages/app/src/modules/techdocs/`) uses exactly this
override.

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
