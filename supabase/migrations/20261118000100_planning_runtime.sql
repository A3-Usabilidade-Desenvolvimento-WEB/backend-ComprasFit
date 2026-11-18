-- Guarda parâmetros opcionais e permite IDs de itens locais a cada plano.
alter table public.plannings add column extra_params jsonb not null default '{}';
alter table public.planning_items drop constraint planning_items_pkey,
  add primary key (planning_id, id);

-- Uma transação grava cabeçalho, refeições e compras ou desfaz tudo.
create function public.save_comprasfit_plan(owner_id uuid, plan jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare plan_id uuid := (plan->>'id')::uuid;
  params jsonb := plan->'params';
begin
  insert into public.plannings(id, user_id, created_at, budget_cents, period_days, people,
    meals_per_day, buying_preference, vegetarian, total_cents, difference_cents, fits_budget, extra_params)
  values(plan_id, owner_id, (plan->>'createdAt')::timestamptz, (plan->>'budgetCents')::int,
    (params->>'periodDays')::int, (params->>'people')::int, (params->>'mealsPerDay')::int,
    params->>'buyingPreference', (params->>'vegetarian')::boolean,
    (plan->'shoppingList'->>'totalCents')::int, (plan->>'differenceCents')::int,
    (plan->>'fitsBudget')::boolean, params - array['budget','periodDays','people','mealsPerDay','buyingPreference','vegetarian']);
  insert into public.planning_meals(planning_id, day, slot, recipe_id, recipe_name)
  select plan_id, day, slot, "recipeId", "recipeName"
  from jsonb_to_recordset(plan->'meals') m(day int, slot int, "recipeId" text, "recipeName" text);
  insert into public.planning_items(planning_id,id,product_id,product_name,category,unit,quantity_needed,
    package_size,packages,leftover,unit_price_cents,subtotal_cents,purchased)
  select plan_id,id,"productId","productName",category,unit,"quantityNeeded","packageSize",
    packages,leftover,"unitPriceCents","subtotalCents",purchased
  from jsonb_to_recordset(plan->'shoppingList'->'items') i(id text,"productId" text,"productName" text,
    category text,unit text,"quantityNeeded" numeric,"packageSize" numeric,packages int,leftover numeric,
    "unitPriceCents" int,"subtotalCents" int,purchased boolean);
end $$;
revoke all on function public.save_comprasfit_plan(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.save_comprasfit_plan(uuid,jsonb) to service_role;

-- As tabelas privadas são lidas apenas pelo servidor. A view histórica
-- de validades também deve respeitar os privilégios das tabelas subjacentes.
alter view public.expiring_pantry_items set (security_invoker = true);
revoke all on public.expiring_pantry_items from public, anon, authenticated;
grant select,insert,update on public.plannings, public.planning_items, public.planning_meals, public.food_expirations to service_role;
grant select on public.products,public.categories,public.prices,public.stores,public.recipes,public.recipe_ingredients to service_role;

create function public.comprasfit_catalog() returns jsonb
language sql stable security invoker set search_path = '' as $$
  with products as (
    select p.id,p.name,c.name as category,p.unit,p.package_quantity as "packageSize"
    from public.products p join public.categories c on c.id=p.category_id
    where p.active and p.package_quantity > 0 and p.unit in ('ml','g','un')
  ), prices as (
    select distinct on (pr.product_id) pr.id,pr.product_id as "productId",
      pr.price_cents as "priceCents",pr.updated_at as "updatedAt",coalesce(s.name,'') as store
    from public.prices pr join products p on p.id=pr.product_id left join public.stores s on s.id=pr.store_id
    order by pr.product_id,pr.updated_at desc,pr.price_cents,pr.id
  ), recipes as (
    select r.id,r.name,r.servings,r.vegetarian,r.preparation_steps as "basePreparation",
      jsonb_agg(jsonb_build_object('productId',i.product_id,'quantity',i.quantity) order by i.product_id) as ingredients
    from public.recipes r join public.recipe_ingredients i on i.recipe_id=r.id
    left join products p on p.id=i.product_id
    where r.base_recipe group by r.id having bool_and(p.id is not null)
  )
  select jsonb_build_object('products',coalesce((select jsonb_agg(products order by id) from products),'[]'),
    'prices',coalesce((select jsonb_agg(prices) from prices),'[]'),
    'recipes',coalesce((select jsonb_agg(recipes order by id) from recipes),'[]'));
$$;

create function public.read_comprasfit_plans(owner_id uuid, plan_id uuid default null)
returns setof jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('id',p.id,'createdAt',p.created_at,'budgetCents',p.budget_cents,
    'differenceCents',p.difference_cents,'fitsBudget',p.fits_budget,
    'params',p.extra_params || jsonb_build_object('budget',p.budget_cents / 100.0,'periodDays',p.period_days,
      'people',p.people,'mealsPerDay',p.meals_per_day,'buyingPreference',p.buying_preference,'vegetarian',p.vegetarian),
    'meals',coalesce((select jsonb_agg(jsonb_build_object('day',m.day,'slot',m.slot,'recipeId',m.recipe_id,
      'recipeName',m.recipe_name) order by m.day,m.slot) from public.planning_meals m where m.planning_id=p.id),'[]'),
    'shoppingList',jsonb_build_object('totalCents',p.total_cents,'items',coalesce((select jsonb_agg(
      jsonb_build_object('id',i.id,'productId',i.product_id,'productName',i.product_name,'category',i.category,
        'unit',i.unit,'quantityNeeded',i.quantity_needed,'packageSize',i.package_size,'packages',i.packages,
        'leftover',i.leftover,'unitPriceCents',i.unit_price_cents,'subtotalCents',i.subtotal_cents,
        'purchased',i.purchased) order by i.category,i.product_name)
      from public.planning_items i where i.planning_id=p.id),'[]')) )
  from public.plannings p where p.user_id=owner_id and (plan_id is null or p.id=plan_id)
  order by p.created_at desc,p.id;
$$;
revoke all on function public.comprasfit_catalog(), public.read_comprasfit_plans(uuid,uuid) from public,anon,authenticated;
grant execute on function public.comprasfit_catalog(), public.read_comprasfit_plans(uuid,uuid) to service_role;
