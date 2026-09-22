# DBML for TechDocs

`backstage-plugin-techdocs-addon-dbml`

[![npm](https://img.shields.io/npm/v/backstage-plugin-techdocs-addon-dbml)](https://www.npmjs.com/package/backstage-plugin-techdocs-addon-dbml)
[![license](https://img.shields.io/github/license/panda-coop/backstage-plugin-techdocs-addon-dbml)](LICENSE)
[![docs](https://img.shields.io/github/actions/workflow/status/panda-coop/backstage-plugin-techdocs-addon-dbml/docs.yml?label=docs)](https://panda-coop.github.io/backstage-plugin-techdocs-addon-dbml/)

Backstage TechDocs addon that turns `dbml` code fences into interactive
entity-relationship diagrams — draggable tables, crow's foot edges,
collapsible table groups, tooltips, and a synced code view.

**Documentation: <https://panda-coop.github.io/backstage-plugin-techdocs-addon-dbml/>**

The published npm package lives in
[`plugins/techdocs-addon-dbml`](plugins/techdocs-addon-dbml);
`packages/app` and `packages/backend` form a dev-only Backstage instance,
and `docs/` is the documentation source (with the addon's development
fixture under `docs/example/`).

## Development

Prerequisites: Node 22 or 24, yarn via corepack, and mkdocs for the local
TechDocs builder (`uv tool install mkdocs --with mkdocs-techdocs-core`).

```sh
yarn install
yarn start
```

Open <http://localhost:3003>, navigate to the
`backstage-plugin-techdocs-addon-dbml` component, and open its **Docs**
tab — the _Examples_ pages exercise the addon. Checks: `yarn tsc`,
`yarn lint:all`, `yarn test`. The public docs are built with
[Zensical](https://zensical.org) (`uvx zensical serve`) and deployed by
the `docs` workflow.

## License

[GPL-3.0-or-later](LICENSE). Copyright (C) 2026 PANDA Coop.
