-- Papel culinário no catálogo. Produtos ainda sem revisão ficam sem classificação.
alter table public.products add column food_role text
  check (food_role in ('Carboidrato', 'Proteína vegetal', 'Proteína animal', 'Laticínio', 'Hortaliça', 'Fruta', 'Molho', 'Gordura'));
alter table public.recipe_ingredients add column main_protein boolean not null default false;

update public.products p set food_role = v.role
from (values
  ('arroz', 'Carboidrato'),
  ('macarrao', 'Carboidrato'),
  ('aveia', 'Carboidrato'),
  ('batata-doce', 'Carboidrato'),
  ('feijao', 'Proteína vegetal'),
  ('lentilha', 'Proteína vegetal'),
  ('frango', 'Proteína animal'),
  ('carne-moida', 'Proteína animal'),
  ('ovos', 'Proteína animal'),
  ('leite', 'Laticínio'),
  ('cebola', 'Hortaliça'),
  ('tomate', 'Hortaliça'),
  ('brocolis', 'Hortaliça'),
  ('cenoura', 'Hortaliça'),
  ('banana', 'Fruta'),
  ('molho-tomate', 'Molho'),
  ('oleo', 'Gordura'),
  ('prd_14f40d5d943f0e3eee9cfa12', 'Proteína animal'),
  ('prd_ce4eedc3bc7d51a7470db5ea', 'Proteína animal'),
  ('prd_f0f30e9a97f2913c41e469d0', 'Proteína animal')
) v(id,role) where p.id = v.id;

-- Um ingrediente pode ser a base da refeição ou apenas dar liga à massa.
update public.recipe_ingredients i set main_protein = true
from (values
  ('arroz-feijao-frango', 'frango'),
  ('arroz-feijao-frango', 'feijao'),
  ('omelete-arroz-legumes', 'ovos'),
  ('carne-moida-batata-doce', 'carne-moida'),
  ('lentilha-arroz-cenoura', 'lentilha'),
  ('frango-brocolis-arroz', 'frango'),
  ('arroz-com-feijao', 'feijao'),
  ('frango-grelhado', 'frango'),
  ('omelete-simples', 'ovos'),
  ('lentilha-tomate', 'lentilha'),
  ('macarrao-lentilha', 'lentilha'),
  ('arroz-carreteiro', 'carne-moida'),
  ('feijao-cenoura', 'feijao'),
  ('ovos-tomate', 'ovos'),
  ('omelete-brocolis', 'ovos'),
  ('lentilha-batata-doce', 'lentilha')
) v(recipe,product) where i.recipe_id = v.recipe and i.product_id = v.product;

create or replace function public.comprasfit_catalog() returns jsonb
language sql stable security invoker set search_path = '' as $$
  with products as (
    select p.id,p.name,c.name as category,p.food_role as "foodRole",p.unit,p.package_quantity as "packageSize"
    from public.products p join public.categories c on c.id=p.category_id
    where p.active and p.package_quantity > 0 and p.unit in ('ml','g','un')
  ), prices as (
    select distinct on (pr.product_id) pr.id,pr.product_id as "productId",
      pr.price_cents as "priceCents",pr.updated_at as "updatedAt",coalesce(s.name,'') as store
    from public.prices pr join products p on p.id=pr.product_id left join public.stores s on s.id=pr.store_id
    order by pr.product_id,pr.updated_at desc,pr.price_cents,pr.id
  ), recipes as (
    select r.id,r.name,r.servings,r.vegetarian,r.preparation_steps as "basePreparation",
      r.preparation_minutes as "preparationMinutes",r.preferences,
      jsonb_agg(jsonb_build_object('productId',i.product_id,'quantity',i.quantity,'mainProtein',i.main_protein) order by i.product_id) as ingredients
    from public.recipes r join public.recipe_ingredients i on i.recipe_id=r.id
    left join products p on p.id=i.product_id
    where r.base_recipe group by r.id having bool_and(p.id is not null)
  )
  select jsonb_build_object('products',coalesce((select jsonb_agg(products order by id) from products),'[]'),
    'prices',coalesce((select jsonb_agg(prices) from prices),'[]'),
    'recipes',coalesce((select jsonb_agg(recipes order by id) from recipes),'[]'));
$$;
