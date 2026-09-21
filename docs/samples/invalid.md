# Invalid DBML

TechDocs loses the fence language for unknown languages, so the addon
claims a text block only when it actually parses as DBML. This broken
fence must therefore stay rendered as a plain code block:

```dbml
Table users {
  id integer [primary key
  username
```

A valid block after the broken one must still render as a diagram:

```dbml
Table healthy {
  id integer [primary key]
}
```
