# Variable: dbmlAddon

> `const` **dbmlAddon**: `OverridableExtensionDefinition`\<\{ `config`: \{ \}; `configInput`: \{ \}; `inputs`: \{ \}; `kind`: `"addon"`; `name`: `"dbml"`; `output`: `ExtensionDataRef`\<`TechDocsAddonOptions`, `"techdocs.addon"`, \{ \}\>; `params`: `TechDocsAddonOptions`; \}\>

Defined in: [plugins/techdocs-addon-dbml/src/alpha.ts:16](https://github.com/panda-coop/backstage-plugin-techdocs-addon-dbml/blob/main/plugins/techdocs-addon-dbml/src/alpha.ts#L16)

TechDocs addon for the new frontend system, shipped as a frontend module
for the techdocs plugin (extension id `addon:techdocs/dbml`) — the same
shape as the mermaid addon. Picked up automatically by package discovery
(`app.packages`) or via `features` in `createApp`.

Note: as of @backstage/plugin-techdocs 1.18.1 the new frontend system
drops all registered addons before rendering (see the README); until that
is fixed upstream, apps need the classic-wiring override documented there.
