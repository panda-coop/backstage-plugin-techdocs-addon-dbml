# Large schema

A wider schema exercising layout, panning, relationship arrows, table
groups, header colors, and table/field notes.

```dbml
Table customers [headerColor: #16a085] {
  id integer [primary key]
  name varchar [not null]
  email varchar [unique, not null, note: 'Primary contact address']
  phone varchar
  billing_address_id integer
  shipping_address_id integer
  created_at timestamp [default: `now()`]
  Note: 'People and companies buying from us'
}

Table addresses {
  id integer [primary key]
  line1 varchar [not null]
  line2 varchar
  city varchar [not null]
  postal_code varchar [not null]
  country_code char(2) [not null]
}

Table products {
  id integer [primary key]
  sku varchar [unique, not null]
  name varchar [not null]
  description text
  category_id integer [not null]
  unit_price decimal(10,2) [not null]
  discontinued boolean [default: false]
}

Table categories {
  id integer [primary key]
  parent_id integer
  name varchar [not null]
}

Table orders {
  id integer [primary key]
  customer_id integer [not null]
  status order_status [not null]
  ordered_at timestamp [default: `now()`]
  shipped_at timestamp
}

Table order_lines {
  order_id integer [not null]
  product_id integer [not null]
  quantity integer [not null, default: 1]
  unit_price decimal(10,2) [not null]

  indexes {
    (order_id, product_id) [pk]
  }
}

Table payments {
  id integer [primary key]
  order_id integer [not null]
  amount decimal(10,2) [not null]
  method varchar [not null]
  paid_at timestamp
}

enum order_status {
  pending
  paid
  shipped
  delivered
  cancelled
}

Ref: customers.billing_address_id > addresses.id
Ref: customers.shipping_address_id > addresses.id
Ref: products.category_id > categories.id
Ref: categories.parent_id > categories.id
Ref: orders.customer_id > customers.id
Ref: order_lines.order_id > orders.id
Ref: order_lines.product_id > products.id
Ref: payments.order_id > orders.id

TableGroup catalog [color: #8e44ad, note: 'Product catalog'] {
  products
  categories
}

TableGroup fulfillment [color: #d35400] {
  orders
  order_lines
  payments
}
```
