import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { AddonBlueprint } from '@backstage/plugin-techdocs-react/alpha';
import { TechDocsAddonLocations } from '@backstage/plugin-techdocs-react';
import { DbmlAddon } from './components/DbmlAddon';

/**
 * TechDocs addon for the new frontend system, shipped as a frontend module
 * for the techdocs plugin (extension id `addon:techdocs/dbml`) — the same
 * shape as the mermaid addon. Picked up automatically by package discovery
 * (`app.packages`) or via `features` in `createApp`.
 *
 * Note: as of @backstage/plugin-techdocs 1.18.1 the new frontend system
 * drops all registered addons before rendering (see the README); until that
 * is fixed upstream, apps need the classic-wiring override documented there.
 */
export const dbmlAddon = AddonBlueprint.make({
  name: 'dbml',
  params: {
    name: 'Dbml',
    location: TechDocsAddonLocations.Content,
    component: DbmlAddon,
  },
});

export default createFrontendModule({
  pluginId: 'techdocs',
  extensions: [dbmlAddon],
});
