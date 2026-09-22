# backstage-plugin-techdocs-addon-dbml

Backstage TechDocs addon rendering interactive DBML diagrams.

This repository is a Backstage workspace: the published npm package lives in
[`plugins/techdocs-addon-dbml`](plugins/techdocs-addon-dbml) (see its README
for usage), while `packages/app` and `packages/backend` form a dev-only
Backstage instance used as a playground. The `docs/` directory is the
project documentation; `docs/example/` holds the DBML sample pages that
double as the addon's development fixture. The whole site is registered in
the dev catalog through the root `catalog-info.yaml`.

## Development

Prerequisites: Node 22 or 24, yarn via corepack, and mkdocs for the local
TechDocs builder:

```sh
uv tool install mkdocs --with mkdocs-techdocs-core
```

Then:

```sh
yarn install
yarn start
```

Open <http://localhost:3003>, navigate to the
`backstage-plugin-techdocs-addon-dbml` component, and open its **Docs** tab.
The pages under _Examples_ exercise the addon.

Run the checks with `yarn tsc`, `yarn lint:all`, and `yarn test`.

## License

[GPL-3.0-or-later](LICENSE). Copyright (C) 2026 PANDA Coop.
