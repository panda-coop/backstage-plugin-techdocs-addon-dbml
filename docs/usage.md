# Usage

## New frontend system

With package discovery enabled (`app.packages: all`) nothing else is
needed; otherwise add the module to `createApp`:

```tsx
import techdocsAddonDbml from 'backstage-plugin-techdocs-addon-dbml/alpha';

export default createApp({
  features: [techdocsAddonDbml],
});
```

### Known upstream limitation

As of `@backstage/plugin-techdocs` 1.18.1 the new frontend system
registers addons but never renders them — the reader's element filter
cannot see through the internal `Addons` component boundary, so every
addon (this one and the `techdocs-module-addons-contrib` ones) is
silently dropped. Until that is fixed upstream, override the entity
Docs tab with the classic wiring:

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

This repo's dev app (`packages/app/src/modules/techdocs/`) uses exactly
this override. Note the override covers the catalog entity Docs tab;
the standalone TechDocs reader route is subject to the same upstream
limitation and shows plain code blocks until the fix lands.

## Classic frontend system

Register the addon on the TechDocs reader and entity pages:

```tsx
import { Dbml } from 'backstage-plugin-techdocs-addon-dbml';

<TechDocsReaderPage>
  <TechDocsAddons>
    <Dbml />
  </TechDocsAddons>
</TechDocsReaderPage>;
```
