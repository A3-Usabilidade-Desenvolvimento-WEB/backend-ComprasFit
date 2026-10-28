-- Protege os dados pessoais quando os repositórios persistentes forem ativados.
-- O backend usa a chave secreta apenas no servidor, mas cada operação deve
-- associar a linha ao usuário autenticado extraído do JWT.

alter table public.plannings
  add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.food_expirations
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists plannings_user_id_idx on public.plannings(user_id);
create index if not exists food_expirations_user_id_idx on public.food_expirations(user_id);

-- A Data API não deve oferecer acesso direto às tabelas internas.
revoke all on public.plannings, public.planning_meals, public.planning_items,
  public.food_expirations, public.prices, public.stores, public.ingredients,
  public.ingredient_products, public.recipe_ingredients
from anon, authenticated;

-- Políticas explícitas de propriedade para quando o frontend precisar de leitura
-- direta autorizada. Enquanto os grants acima permanecerem revogados, o acesso
-- ocorre exclusivamente pelas rotas do backend autenticadas.
drop policy if exists "users read own plannings" on public.plannings;
create policy "users read own plannings"
on public.plannings for select to authenticated
using (user_id = auth.uid());

drop policy if exists "users manage own plannings" on public.plannings;
create policy "users manage own plannings"
on public.plannings for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users read own expirations" on public.food_expirations;
create policy "users read own expirations"
on public.food_expirations for select to authenticated
using (user_id = auth.uid());

drop policy if exists "users manage own expirations" on public.food_expirations;
create policy "users manage own expirations"
on public.food_expirations for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
