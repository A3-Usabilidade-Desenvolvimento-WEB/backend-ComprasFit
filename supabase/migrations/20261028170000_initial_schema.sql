-- Fonte única de estrutura do ComprasFit em PostgreSQL/Supabase.
-- Adaptado do protótipo SQLite para preservar os IDs públicos string do backend
-- e valores monetários inteiros em centavos.

create table public.categories (
  id text primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.products (
  id text primary key,
  category_id text not null references public.categories(id),
  name text not null unique,
  normalized_name text not null unique,
  name_truncated boolean not null default false,
  package_quantity numeric,
  unit text check (unit in ('g', 'kg', 'ml', 'l', 'un')),
  default_expiration_days integer check (default_expiration_days is null or default_expiration_days >= 0),
  review_category boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index products_category_id_idx on public.products(category_id);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  city text,
  created_at timestamptz not null default now()
);

create table public.prices (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  store_id uuid references public.stores(id),
  price_cents integer not null check (price_cents >= 0),
  updated_at date not null default current_date,
  source text,
  created_at timestamptz not null default now()
);
create index prices_product_updated_at_idx on public.prices(product_id, updated_at desc);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  default_unit text not null default 'g' check (default_unit in ('g', 'ml', 'un')),
  created_at timestamptz not null default now()
);

create table public.ingredient_products (
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  primary key (ingredient_id, product_id)
);

create table public.recipes (
  id text primary key,
  name text not null unique,
  description text,
  servings integer not null default 1 check (servings > 0),
  preparation_minutes integer check (preparation_minutes is null or preparation_minutes >= 0),
  preparation_steps jsonb not null default '[]'::jsonb,
  vegetarian boolean not null default false,
  base_recipe boolean not null default true,
  created_at timestamptz not null default now()
);

-- O backend existente calcula planejamento por produto. Por isso esta relação
-- registra produto diretamente, sem eliminar o catálogo abstrato de ingredientes.
create table public.recipe_ingredients (
  recipe_id text not null references public.recipes(id) on delete cascade,
  product_id text not null references public.products(id),
  quantity numeric not null check (quantity > 0),
  unit text not null check (unit in ('g', 'ml', 'un')),
  primary key (recipe_id, product_id)
);

create table public.plannings (
  id uuid primary key default gen_random_uuid(),
  budget_cents integer not null check (budget_cents > 0),
  period_days integer not null check (period_days between 1 and 31),
  people integer not null check (people between 1 and 20),
  meals_per_day integer not null check (meals_per_day between 1 and 4),
  buying_preference text not null check (buying_preference in ('lowest_price', 'variety')),
  vegetarian boolean not null default false,
  total_cents integer not null check (total_cents >= 0),
  difference_cents integer not null,
  fits_budget boolean not null,
  created_at timestamptz not null default now()
);

create table public.planning_meals (
  planning_id uuid not null references public.plannings(id) on delete cascade,
  day integer not null check (day > 0),
  slot integer not null check (slot > 0),
  recipe_id text not null references public.recipes(id),
  recipe_name text not null,
  primary key (planning_id, day, slot)
);

create table public.planning_items (
  id text primary key,
  planning_id uuid not null references public.plannings(id) on delete cascade,
  product_id text not null references public.products(id),
  product_name text not null,
  category text not null,
  unit text not null,
  quantity_needed numeric not null check (quantity_needed > 0),
  package_size numeric not null check (package_size > 0),
  packages integer not null check (packages > 0),
  leftover numeric not null check (leftover >= 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  purchased boolean not null default false
);
create index planning_items_planning_id_idx on public.planning_items(planning_id);

create table public.food_expirations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  product_id text references public.products(id),
  expiration_date date not null,
  registered_at timestamptz not null default now()
);
create index food_expirations_expiration_date_idx on public.food_expirations(expiration_date);

create view public.current_prices as
select distinct on (product_id, coalesce(store_id::text, ''))
  id, product_id, store_id, price_cents, updated_at, source
from public.prices
order by product_id, coalesce(store_id::text, ''), updated_at desc, id desc;

create view public.lowest_current_prices as
select product_id, min(price_cents) as price_cents, max(updated_at) as updated_at
from public.current_prices
group by product_id;

create view public.expiring_pantry_items as
select e.id, e.name, e.product_id, e.expiration_date,
       (e.expiration_date - current_date) as days_remaining
from public.food_expirations e
where e.expiration_date is not null
order by e.expiration_date;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.stores enable row level security;
alter table public.prices enable row level security;
alter table public.ingredients enable row level security;
alter table public.ingredient_products enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.plannings enable row level security;
alter table public.planning_meals enable row level security;
alter table public.planning_items enable row level security;
alter table public.food_expirations enable row level security;
