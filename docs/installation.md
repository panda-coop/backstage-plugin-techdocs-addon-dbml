# Installation

Add the package to your Backstage app package:

```bash
yarn --cwd packages/app add backstage-plugin-techdocs-addon-dbml
```

The package ships two entry points:

| Export | Contents |
|---|---|
| `backstage-plugin-techdocs-addon-dbml` | `Dbml` addon component (classic frontend system, and the entity-tab override below) |
| `backstage-plugin-techdocs-addon-dbml/alpha` | Frontend module for the new frontend system |

Everything the addon renders is self-contained: it brings its own React
Flow styles into the TechDocs shadow root, so no CSS or mkdocs
configuration is required. See [Usage](usage.md) for the wiring.

## Requirements

- A Backstage app with TechDocs set up.
- React 18 (peer dependency).

## License

GPL-3.0-or-later. Copyright (C) 2026 PANDA Coop.
