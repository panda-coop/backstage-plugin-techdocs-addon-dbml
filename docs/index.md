# DBML addon fixture docs

This TechDocs site exists to exercise the `backstage-plugin-techdocs-addon-dbml`
addon during development. Each page under **DBML samples** contains `dbml`
code fences the addon should pick up and replace with an interactive diagram.

A minimal inline sample:

```dbml
Table users {
  id integer [primary key]
  username varchar [unique, not null]
  created_at timestamp
}

Table posts {
  id integer [primary key]
  user_id integer [not null]
  title varchar
  body text
}

Ref: posts.user_id > users.id
```

Regular code fences must stay untouched:

```sql
SELECT id, username FROM users WHERE created_at > now() - interval '1 day';
```
