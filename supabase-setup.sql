-- ============================================================
-- INVENTARIO — Schema completo
-- Cole no SQL Editor do Supabase e clique em Run
-- ============================================================

create table if not exists groups (
  id text primary key,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists equipment (
  id text primary key,
  name text not null,
  category text,
  group_id text,
  quantity integer not null default 0,
  in_use integer not null default 0,
  type text not null default 'returnable',
  last_unit_price numeric not null default 0,
  notes text,
  photo text,
  created_at timestamptz default now()
);

create table if not exists outings (
  id text primary key,
  person text not null,
  location text,
  start_date text,
  end_date text,
  status text not null default 'active',
  returned_by text,
  return_date text,
  created_at timestamptz default now()
);

create table if not exists outing_items (
  id text primary key,
  outing_id text not null references outings(id) on delete cascade,
  equipment_id text,
  name text,
  taken integer not null default 0,
  returned integer not null default 0,
  type text not null default 'returnable'
);

create table if not exists outing_pending_items (
  id text primary key,
  outing_id text not null references outings(id) on delete cascade,
  equipment_id text,
  name text,
  missing integer not null default 0
);

create table if not exists outing_pending_resolved (
  id text primary key,
  outing_id text not null references outings(id) on delete cascade,
  equipment_id text,
  name text,
  qty integer,
  mode text,
  date text
);

create table if not exists purchases (
  id text primary key,
  date text,
  location text,
  notes text,
  outing_id text references outings(id),
  grand_total numeric not null default 0,
  receipt_data_url text,
  receipt_type text,
  receipt_name text,
  created_at timestamptz default now()
);

create table if not exists purchase_lines (
  id text primary key,
  purchase_id text not null references purchases(id) on delete cascade,
  equipment_id text,
  name text,
  qty numeric not null default 1,
  unit_price numeric not null default 0
);

-- Desabilitar RLS (app de usuário único, sem autenticação por enquanto)
alter table groups                  disable row level security;
alter table equipment               disable row level security;
alter table outings                 disable row level security;
alter table outing_items            disable row level security;
alter table outing_pending_items    disable row level security;
alter table outing_pending_resolved disable row level security;
alter table purchases               disable row level security;
alter table purchase_lines          disable row level security;
