# Invalid DBML

This fence is intentionally broken; the addon must show a parse error
instead of crashing the page or silently hiding the block.

```dbml
Table users {
  id integer [primary key
  username
```

A valid block after the broken one must still render:

```dbml
Table healthy {
  id integer [primary key]
}
```
