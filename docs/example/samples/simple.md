# Simple schema

A two-table schema with one relationship — the smallest useful case.

```dbml
Table users {
  id integer [primary key]
  username varchar [unique, not null]
  email varchar [unique]
  created_at timestamp [default: `now()`]
}

Table posts {
  id integer [primary key]
  user_id integer [not null]
  title varchar [not null]
  body text
  published_at timestamp
}

Ref: posts.user_id > users.id
```
