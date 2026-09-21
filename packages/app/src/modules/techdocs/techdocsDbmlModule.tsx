import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { EntityContentBlueprint } from '@backstage/plugin-catalog-react/alpha';
import { convertLegacyRouteRef } from '@backstage/core-compat-api';
import { techdocsPlugin } from '@backstage/plugin-techdocs';

/**
 * Replaces techdocs' entity Docs tab with the classic reader wiring so
 * TechDocs addons render. The stock new-frontend-system addon path
 * (@backstage/plugin-techdocs 1.18.1) is broken: its Addons wrapper hides
 * the tagged <TechDocsAddons> element behind a component boundary, and the
 * reader's element filter (which only walks props.children) never finds it,
 * so every addon — ours and the contrib ones — is silently dropped. The
 * classic route-children mechanism used here is what the element filter
 * was built for. Remove this module once upstream fixes addon rendering.
 */
const dbmlEntityContent = EntityContentBlueprint.make({
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
  extensions: [dbmlEntityContent],
});
