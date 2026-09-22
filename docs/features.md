# Features

## Diagram view

Tables render as draggable nodes with one row per column; primary keys
are marked `[pk]`, not-null columns get a `*` suffix. Layout is
computed with dagre (left to right) and the canvas supports pan and
zoom. Relationships are field-anchored edges in crow's foot notation —
the many side fans out, the one side gets a perpendicular tick — with
cardinality derived from the DBML `Ref` operator (`>`, `<`, `-`, `<>`).
Hovering or selecting an edge highlights it.

## Table groups

`TableGroup` renders as a rounded, tinted container behind its member
tables. The tint comes from `[color: #...]` when set; groups without a
color pick from a calm palette by declaration order. Groups auto-grow
when a member table is dragged against their edge and push neighboring
tables and groups out of the way instead of overlapping them; dragging
a group moves its members with it.

Clicking a group (or its chevron) collapses it to a compact header
block: member tables hide and their relationships re-anchor on the
block. Expanding a group that was parked in a tight spot repositions it
into free space.

## Collapsible tables

The chevron in a table header collapses the table to its header row;
its relationships re-anchor at header height. A collapsed group takes
precedence over collapsed tables inside it.

## Notes and enums

| DBML | Rendering |
|---|---|
| `Note: '...'` on a table | Note icon in the header, tooltip on hover |
| `[note: '...']` on a column | Tooltip on the column row |
| Note on a `TableGroup` | Tooltip on the group header |
| Column typed with a declared enum | `E` chip; the row tooltip lists the enum values and their notes |

## Code view

The diagram/code toggle switches to the DBML source with syntax
highlighting close to dbdiagram.io: keywords blue, column types salmon,
settings muted, strings green, comments green italic, backtick
expressions purple, ref operators yellow, and hex color literals get an
inline color swatch.

## Expand dialog

The expand button opens the diagram in a near-fullscreen dialog. The
diagram/code view is shared with the inline block — the dialog opens in
whatever view is active and switching in either place stays in sync.

## Theming

All colors resolve from the active Backstage MUI theme (light and dark),
including custom company themes; syntax token colors are fixed per mode.
The widget is self-contained inside the TechDocs shadow root and brings
its own styles.
