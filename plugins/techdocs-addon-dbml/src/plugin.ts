import { createPlugin } from '@backstage/core-plugin-api';
import {
  createTechDocsAddonExtension,
  TechDocsAddonLocations,
} from '@backstage/plugin-techdocs-react';
import { DbmlAddon } from './components/DbmlAddon';

export const techdocsAddonDbmlPlugin = createPlugin({
  id: 'techdocs-addon-dbml',
});

/**
 * TechDocs addon for the classic frontend system, used inside
 * `<TechDocsAddons>` on the reader and entity pages.
 */
export const Dbml = techdocsAddonDbmlPlugin.provide(
  createTechDocsAddonExtension({
    name: 'Dbml',
    location: TechDocsAddonLocations.Content,
    component: DbmlAddon,
  }),
);
