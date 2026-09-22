# DBML for TechDocs

[![npm](https://img.shields.io/npm/v/backstage-plugin-techdocs-addon-dbml)](https://www.npmjs.com/package/backstage-plugin-techdocs-addon-dbml)
[![license](https://img.shields.io/github/license/panda-coop/backstage-plugin-techdocs-addon-dbml)](https://github.com/panda-coop/backstage-plugin-techdocs-addon-dbml/blob/main/LICENSE)
[![docs](https://img.shields.io/github/actions/workflow/status/panda-coop/backstage-plugin-techdocs-addon-dbml/docs.yml?label=docs)](https://panda-coop.github.io/backstage-plugin-techdocs-addon-dbml/)

Backstage TechDocs addon that replaces `dbml` code fences in TechDocs
pages with interactive entity-relationship diagrams. Parsing is done with
[`@dbml/core`](https://www.dbml.org/), rendering with React Flow:
draggable tables, crow's foot relationship edges, collapsible tables and
table groups, note tooltips and enum chips, a syntax-highlighted code
view, and a near-fullscreen expand dialog — all themed from the active
Backstage theme.

**Full documentation:**
<https://panda-coop.github.io/backstage-plugin-techdocs-addon-dbml/>

## Install

```bash
yarn --cwd packages/app add backstage-plugin-techdocs-addon-dbml
```

## Quick start (new frontend system)

```tsx
import techdocsAddonDbml from 'backstage-plugin-techdocs-addon-dbml/alpha';

export default createApp({
  features: [techdocsAddonDbml],
});
```

As of `@backstage/plugin-techdocs` 1.18.1 the new frontend system
registers TechDocs addons but never renders them; until that is fixed
upstream an entity-tab override is required — see
[Usage](https://panda-coop.github.io/backstage-plugin-techdocs-addon-dbml/usage/)
for the full workaround and the classic frontend system wiring. Authoring
rules (which code blocks are claimed and how) are covered in
[Authoring](https://panda-coop.github.io/backstage-plugin-techdocs-addon-dbml/authoring/).

## License

GPL-3.0-or-later. Copyright (C) 2026 PANDA Coop.
