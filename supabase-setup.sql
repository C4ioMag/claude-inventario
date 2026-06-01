-- ============================================================
-- INVENTARIO — Schema completo v2
-- Execute no Supabase SQL Editor (Settings > SQL Editor > New query)
-- Este script é seguro para rodar múltiplas vezes (IF NOT EXISTS)
-- ============================================================

-- GRUPOS
create table if not exists groups (
  id text primary key,
  name text not null,
  created_at timestamptz default now()
);

-- ESTOQUE
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

-- SAÍDAS (supervisores em campo)
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

-- COMPRAS
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

-- LINHAS DE COMPRA (um registro por item da nota)
create table if not exists purchase_lines (
  id text primary key,
  purchase_id text not null references purchases(id) on delete cascade,
  equipment_id text,           -- vínculo com estoque (se existir)
  name text,                   -- nome completo: "Fuel Filter / Filtro de Combustível"
  qty numeric not null default 1,
  unit_price numeric not null default 0,
  -- Novos campos para rastreamento preciso:
  hts_code text,               -- ex: "8421.23.0000"
  hts_description text,        -- ex: "Filtering machinery for liquids"
  sku text,                    -- número de peça / SKU da loja
  store text,                  -- nome da loja extraído da nota
  sku_key text,                -- chave de identificação: STORE_SKU (ex: AUTOZONE_SP308)
  status text default 'inventory', -- 'inventory' | 'used'
  used_description text        -- onde foi aplicado (ex: "TRK-016 — AC recharge")
);

-- Adicionar colunas novas em tabelas existentes (seguro se já existir)
alter table purchase_lines add column if not exists hts_code text;
alter table purchase_lines add column if not exists hts_description text;
alter table purchase_lines add column if not exists sku text;
alter table purchase_lines add column if not exists store text;
alter table purchase_lines add column if not exists sku_key text;
alter table purchase_lines add column if not exists status text default 'inventory';
alter table purchase_lines add column if not exists used_description text;

-- Desabilitar RLS (app interno, sem auth por enquanto)
alter table groups                  disable row level security;
alter table equipment               disable row level security;
alter table outings                 disable row level security;
alter table outing_items            disable row level security;
alter table outing_pending_items    disable row level security;
alter table outing_pending_resolved disable row level security;
alter table purchases               disable row level security;
alter table purchase_lines          disable row level security;
