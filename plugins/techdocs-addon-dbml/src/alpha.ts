import { createFrontendPlugin } from '@backstage/frontend-plugin-api';
import { AddonBlueprint } from '@backstage/plugin-techdocs-react/alpha';
import { TechDocsAddonLocations } from '@backstage/plugin-techdocs-react';
import { DbmlAddon } from './components/DbmlAddon';

/**
 * TechDocs addon for the new frontend system; picked up automatically by
 * package discovery (`app.packages`) or via `features` in `createApp`.
 */
export const dbmlAddon = AddonBlueprint.make({
  name: 'dbml',
  params: {
    name: 'Dbml',
    location: TechDocsAddonLocations.Content,
    component: DbmlAddon,
  },
});

export default createFrontendPlugin({
  pluginId: 'techdocs-addon-dbml',
  extensions: [dbmlAddon],
});
