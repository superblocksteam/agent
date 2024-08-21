// pg_catalog is the fastest way to get table info in Postgres
// https://dba.stackexchange.com/questions/302587/what-is-faster-pg-catalog-or-information-schema
export const TableQuery = `select a.attname as name,
  t1.typname as column_type,
  case when a.atthasdef then pg_get_expr(d.adbin, d.adrelid) end as default_expr,
  c.relkind as kind,
  c.relname as table_name,
  n.nspname as schema_name
from pg_catalog.pg_attribute a
  left join pg_catalog.pg_type t1 on t1.oid = a.atttypid
  inner join pg_catalog.pg_class c on a.attrelid = c.oid
  left join pg_catalog.pg_namespace n on c.relnamespace = n.oid
  left join pg_catalog.pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
where a.attnum > 0
  and not a.attisdropped
  and n.nspname not in ('information_schema', 'pg_catalog')
  and c.relkind in ('r', 'v')
  and pg_catalog.pg_table_is_visible(a.attrelid)
order by c.relname, a.attnum;`;

export const KeysQuery = `select c.conname as constraint_name,
  c.contype as constraint_type,
  sch.nspname as self_schema,
  tbl.relname as self_table,
  array_to_json(array_agg(col.attname order by u.attposition))     as self_columns,
  pg_get_constraintdef(c.oid)                       as definition
from pg_constraint c
  left join lateral unnest(c.conkey) with ordinality as u(attnum, attposition) on true
  left join lateral unnest(c.confkey) with ordinality as f_u(attnum, attposition)
            on f_u.attposition = u.attposition
  join pg_class tbl on tbl.oid = c.conrelid
  join pg_namespace sch on sch.oid = tbl.relnamespace
  left join pg_attribute col on (col.attrelid = tbl.oid and col.attnum = u.attnum)
group by constraint_name, constraint_type, self_schema, self_table, definition
order by self_schema, self_table`;
