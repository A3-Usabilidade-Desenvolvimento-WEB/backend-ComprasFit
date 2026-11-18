-- Catálogo acadêmico inicial. Os preços de exemplo mantêm a data e a loja de origem.

insert into public.categories(id,name) values
  ('cat_8341b8250c08fa431a425ff4', 'Grãos'),
  ('cat_033219d7206bc15b80974531', 'Carnes'),
  ('cat_333a89e4dc0c39bdcdf220ec', 'Laticínios e ovos'),
  ('cat_ce4abf7dd192a29463aa4971', 'Hortifruti'),
  ('cat_dbb4e4ffe546d3066b6c6cb7', 'Mercearia')
on conflict (name) do nothing;

insert into public.products(id,category_id,name,normalized_name,package_quantity,unit)
select p.id,c.id,p.name,p.normalized_name,p.size,p.unit from (values
  ('arroz', 'Grãos', 'Arroz branco 5kg', 'arroz branco 5kg', 5000, 'g'),
  ('feijao', 'Grãos', 'Feijão carioca 1kg', 'feijao carioca 1kg', 1000, 'g'),
  ('lentilha', 'Grãos', 'Lentilha 500g', 'lentilha 500g', 500, 'g'),
  ('macarrao', 'Grãos', 'Macarrão espaguete 500g', 'macarrao espaguete 500g', 500, 'g'),
  ('aveia', 'Grãos', 'Aveia em flocos 170g', 'aveia em flocos 170g', 170, 'g'),
  ('frango', 'Carnes', 'Peito de frango 1kg', 'peito de frango 1kg', 1000, 'g'),
  ('carne-moida', 'Carnes', 'Carne moída 500g', 'carne moida 500g', 500, 'g'),
  ('ovos', 'Laticínios e ovos', 'Ovos (dúzia)', 'ovos (duzia)', 12, 'un'),
  ('leite', 'Laticínios e ovos', 'Leite integral 1L', 'leite integral 1l', 1000, 'ml'),
  ('cebola', 'Hortifruti', 'Cebola 1kg', 'cebola 1kg', 1000, 'g'),
  ('tomate', 'Hortifruti', 'Tomate 1kg', 'tomate 1kg', 1000, 'g'),
  ('batata-doce', 'Hortifruti', 'Batata-doce 1kg', 'batata-doce 1kg', 1000, 'g'),
  ('brocolis', 'Hortifruti', 'Brócolis (maço 300g)', 'brocolis (maco 300g)', 300, 'g'),
  ('cenoura', 'Hortifruti', 'Cenoura 1kg', 'cenoura 1kg', 1000, 'g'),
  ('banana', 'Hortifruti', 'Banana prata 1kg', 'banana prata 1kg', 1000, 'g'),
  ('molho-tomate', 'Mercearia', 'Molho de tomate 340g', 'molho de tomate 340g', 340, 'g'),
  ('oleo', 'Mercearia', 'Óleo de soja 900ml', 'oleo de soja 900ml', 900, 'ml')
) p(id,category,name,normalized_name,size,unit) join public.categories c on c.name=p.category
on conflict (normalized_name) do update set package_quantity=excluded.package_quantity,unit=excluded.unit;

insert into public.stores(name) values ('Supermercado Exemplo') on conflict (name) do nothing;

insert into public.prices(product_id,store_id,price_cents,updated_at,source)
select p.id,s.id,v.cents,'2026-09-01','academic-seed' from (values
  ('arroz branco 5kg', 2790),
  ('feijao carioca 1kg', 849),
  ('lentilha 500g', 799),
  ('macarrao espaguete 500g', 499),
  ('aveia em flocos 170g', 429),
  ('peito de frango 1kg', 1890),
  ('carne moida 500g', 1790),
  ('ovos (duzia)', 1150),
  ('leite integral 1l', 529),
  ('cebola 1kg', 690),
  ('tomate 1kg', 890),
  ('batata-doce 1kg', 750),
  ('brocolis (maco 300g)', 550),
  ('cenoura 1kg', 590),
  ('banana prata 1kg', 649),
  ('molho de tomate 340g', 279),
  ('oleo de soja 900ml', 749)
) v(name,cents) join public.products p on p.normalized_name=v.name
join public.stores s on s.name='Supermercado Exemplo';

insert into public.recipes(id,name,servings,vegetarian,preparation_steps) values
  ('arroz-feijao-frango', 'Arroz, feijão e frango grelhado', 2, false, '["Cozinhe o arroz e o feijão separadamente.","Tempere o frango e grelhe até dourar dos dois lados.","Refogue a cebola no óleo e misture ao feijão.","Sirva tudo junto."]'::jsonb),
  ('macarrao-molho-tomate', 'Macarrão ao molho de tomate', 2, true, '["Cozinhe o macarrão em água fervente até ficar al dente.","Refogue a cebola no óleo e adicione o molho de tomate.","Misture o macarrão ao molho e sirva."]'::jsonb),
  ('omelete-arroz-legumes', 'Omelete com arroz e legumes', 2, true, '["Cozinhe o arroz.","Pique o tomate e a cebola e refogue no óleo.","Bata os ovos, despeje sobre os legumes e deixe firmar.","Sirva a omelete com o arroz."]'::jsonb),
  ('carne-moida-batata-doce', 'Carne moída com batata-doce', 2, false, '["Cozinhe a batata-doce em pedaços até ficar macia.","Refogue a cebola, adicione a carne moída e o tomate picado.","Cozinhe até a carne secar e sirva com a batata-doce."]'::jsonb),
  ('lentilha-arroz-cenoura', 'Lentilha com arroz e cenoura', 2, true, '["Cozinhe a lentilha com a cenoura ralada até ficar macia.","Refogue a cebola e misture à lentilha.","Cozinhe o arroz e sirva junto."]'::jsonb),
  ('frango-brocolis-arroz', 'Frango com brócolis e arroz', 2, false, '["Corte o frango em cubos e doure em uma panela.","Cozinhe o brócolis no vapor por alguns minutos.","Cozinhe o arroz e sirva tudo junto."]'::jsonb),
  ('mingau-aveia-banana', 'Mingau de aveia com banana', 2, true, '["Aqueça o leite com a aveia mexendo até engrossar.","Amasse a banana e misture ao mingau.","Sirva morno."]'::jsonb)
on conflict (id) do nothing;

insert into public.recipe_ingredients(recipe_id,product_id,quantity,unit)
select v.recipe,p.id,v.quantity,p.unit from (values
  ('arroz-feijao-frango', 'arroz branco 5kg', 160),
  ('arroz-feijao-frango', 'feijao carioca 1kg', 100),
  ('arroz-feijao-frango', 'peito de frango 1kg', 300),
  ('arroz-feijao-frango', 'cebola 1kg', 50),
  ('arroz-feijao-frango', 'oleo de soja 900ml', 10),
  ('macarrao-molho-tomate', 'macarrao espaguete 500g', 200),
  ('macarrao-molho-tomate', 'molho de tomate 340g', 170),
  ('macarrao-molho-tomate', 'cebola 1kg', 50),
  ('macarrao-molho-tomate', 'oleo de soja 900ml', 10),
  ('omelete-arroz-legumes', 'ovos (duzia)', 4),
  ('omelete-arroz-legumes', 'arroz branco 5kg', 120),
  ('omelete-arroz-legumes', 'tomate 1kg', 100),
  ('omelete-arroz-legumes', 'cebola 1kg', 50),
  ('omelete-arroz-legumes', 'oleo de soja 900ml', 10),
  ('carne-moida-batata-doce', 'carne moida 500g', 300),
  ('carne-moida-batata-doce', 'batata-doce 1kg', 400),
  ('carne-moida-batata-doce', 'cebola 1kg', 50),
  ('carne-moida-batata-doce', 'tomate 1kg', 100),
  ('lentilha-arroz-cenoura', 'lentilha 500g', 200),
  ('lentilha-arroz-cenoura', 'arroz branco 5kg', 120),
  ('lentilha-arroz-cenoura', 'cenoura 1kg', 100),
  ('lentilha-arroz-cenoura', 'cebola 1kg', 50),
  ('frango-brocolis-arroz', 'peito de frango 1kg', 300),
  ('frango-brocolis-arroz', 'brocolis (maco 300g)', 300),
  ('frango-brocolis-arroz', 'arroz branco 5kg', 120),
  ('mingau-aveia-banana', 'aveia em flocos 170g', 80),
  ('mingau-aveia-banana', 'leite integral 1l', 400),
  ('mingau-aveia-banana', 'banana prata 1kg', 200)
) v(recipe,name,quantity) join public.products p on p.normalized_name=v.name
on conflict (recipe_id,product_id) do nothing;
