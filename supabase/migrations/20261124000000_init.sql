-- Control de Gastos — migración inicial (Supabase / Postgres)
-- Dinero en céntimos enteros (int). Saldo = apertura + recargas - gastos.
-- La seguridad real es RLS: cada usuario solo ve sus filas (user_id = auth.uid()).
-- Nunca se expone service_role en el frontend.

create extension if not exists "pgcrypto";

-- 5 categorías reales, verificadas en la app (getState 2026-11-24).
-- "Fuel, Parking & Salik" es UNA sola categoría.
create type expense_category as enum (
  'Pantry & Grocery',
  'Fuel, Parking & Salik',
  'Food Expenses',
  'Printing & Stationery',
  'Other Expenses'
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  currency text not null default 'AED',
  created_at timestamptz not null default now()
);

create table if not exists public.months (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  seq int not null,
  tab text not null,               -- EXP1, EXP2, ...
  label text not null,             -- "Noviembre 2026"
  short_label text not null,       -- "NOV"
  from_date date not null,
  to_date date not null,
  ref_no text not null,            -- "2026-11/005"
  opening_cents int not null default 0, -- = saldo del mes anterior (puede ser negativo)
  created_at timestamptz not null default now(),
  unique (user_id, seq),
  unique (user_id, tab),
  check (to_date >= from_date)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  month_id uuid not null references public.months (id) on delete cascade,
  date date not null,
  amount_cents int not null check (amount_cents > 0),
  category expense_category not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.topups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  month_id uuid not null references public.months (id) on delete cascade,
  date date not null,
  amount_cents int not null check (amount_cents > 0),
  description text not null default 'Cash top-up',
  created_at timestamptz not null default now()
);

create index if not exists idx_months_user_seq on public.months (user_id, seq);
create index if not exists idx_expenses_month_date on public.expenses (month_id, date);
create index if not exists idx_topups_month_date on public.topups (month_id, date);

-- ─── updated_at ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_expenses_updated_at on public.expenses;
create trigger trg_expenses_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- ─── Reglas de negocio en la BD (no solo en el cliente) ────────────────────
-- Máximo 16 gastos por mes (límite de la hoja EXP, filas 6-21) y fecha
-- dentro del mes. Si el cliente intenta saltárselo, la BD lo rechaza.
create or replace function public.validate_expense()
returns trigger language plpgsql as $$
declare
  n int;
  m public.months%rowtype;
begin
  select * into m from public.months where id = new.month_id;
  if m.id is null then raise exception 'Mes no encontrado'; end if;
  if m.user_id <> new.user_id then
    raise exception 'el mes no pertenece al usuario';
  end if;
  if new.date < m.from_date or new.date > m.to_date then
    raise exception 'La fecha tiene que estar dentro del mes %', m.label;
  end if;
  select count(*) into n from public.expenses where month_id = new.month_id;
  if tg_op = 'INSERT' and n >= 16 then
    raise exception 'Este mes ya tiene 16 gastos, el máximo de la hoja EXP.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_expense on public.expenses;
create trigger trg_validate_expense
  before insert or update on public.expenses
  for each row execute function public.validate_expense();

-- ─── Vistas derivadas (los totales se calculan, no se guardan) ─────────────
create or replace view public.month_summary as
select
  m.*,
  coalesce(e.total_cents, 0) as total_cents,
  coalesce(t.recargas_cents, 0) as recargas_cents,
  m.opening_cents + coalesce(t.recargas_cents, 0) - coalesce(e.total_cents, 0) as saldo_cents
from public.months m
left join (
  select month_id, sum(amount_cents)::int as total_cents
  from public.expenses group by month_id
) e on e.month_id = m.id
left join (
  select month_id, sum(amount_cents)::int as recargas_cents
  from public.topups group by month_id
) t on t.month_id = m.id;

create or replace view public.report_ledger as
select user_id, date, description, receipts_cents, bills_cents,
  sum(coalesce(receipts_cents, 0) - coalesce(bills_cents, 0))
    over (partition by user_id order by date, description) as running_cents
from (
  select user_id, date, description, amount_cents as receipts_cents, null::int as bills_cents
  from public.topups
  union all
  select m.user_id, m.to_date as date, 'Total expenses ' || lower(m.label) as description,
    null::int, s.total_cents as bills_cents
  from public.months m
  join public.month_summary s on s.id = m.id
  where s.total_cents > 0
) ledger;

-- ─── RPC: crear el mes siguiente (atómico) ─────────────────────────────────
create or replace function public.create_next_month()
returns public.months
language plpgsql
security definer
set search_path = public
as $$
declare
  last_m public.months%rowtype;
  last_saldo int;
  next_from date;
  next_to date;
  new_m public.months%rowtype;
begin
  select * into last_m from public.months
  where user_id = auth.uid() order by seq desc limit 1;
  if last_m.id is null then raise exception 'No hay meses'; end if;

  select saldo_cents into last_saldo
  from public.month_summary where id = last_m.id;

  next_from := date_trunc('month', last_m.to_date + interval '1 day')::date;
  next_to := (date_trunc('month', next_from) + interval '1 month' - interval '1 day')::date;

  insert into public.months
    (user_id, seq, tab, label, short_label, from_date, to_date, ref_no, opening_cents)
  values (
    auth.uid(),
    last_m.seq + 1,
    'EXP' || (last_m.seq + 1),
    initcap(to_char(next_from, 'TMMonth YYYY')),
    upper(to_char(next_from, 'TMMon')),
    next_from, next_to,
    to_char(next_from, 'YYYY-MM') || '/' || lpad((last_m.seq + 1)::text, 3, '0'),
    last_saldo
  )
  returning * into new_m;
  return new_m;
end;
$$;

-- ─── RPC: borrar solo el último mes ─────────────────────────────────────────
create or replace function public.delete_last_month()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  last_m public.months%rowtype;
  n int;
begin
  select count(*) into n from public.months where user_id = auth.uid();
  if n <= 1 then raise exception 'No se puede borrar el único mes.'; end if;
  select * into last_m from public.months
  where user_id = auth.uid() order by seq desc limit 1;
  delete from public.months where id = last_m.id; -- cascade borra gastos y recargas
end;
$$;

-- ─── RLS: cada usuario solo toca lo suyo ───────────────────────────────────
alter table public.profiles enable row level security;
alter table public.months enable row level security;
alter table public.expenses enable row level security;
alter table public.topups enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "own months" on public.months;
create policy "own months" on public.months
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own expenses" on public.expenses;
create policy "own expenses" on public.expenses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own topups" on public.topups;
create policy "own topups" on public.topups
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
