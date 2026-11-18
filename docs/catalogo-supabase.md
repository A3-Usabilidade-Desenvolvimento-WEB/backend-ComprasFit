# Catálogo no Supabase

A migration `20261118000200_academic_catalog.sql` fornece sete receitas e dezessete produtos com embalagens e preços de referência. A função `comprasfit_catalog` carrega os produtos ativos com embalagem utilizável, seus preços recentes e as receitas com ingredientes correspondentes. As sugestões validam nomes no CSV e, em modo persistente, também verificam se o ingrediente da lista está ativo na tabela de produtos.

O script `scripts/import-catalog-to-supabase.mjs` importa os nomes comerciais e as categorias do CSV. Produtos importados sem tamanho de embalagem permanecem no catálogo de nomes autorizados. O procedimento está em [Deploy do backend](deploy-vercel.md).

A migration `20261118000300_expand_catalog.sql` incorpora os 1.015 produtos do SQLite com os metadados disponíveis, normaliza kg e l para g e ml e carrega os vínculos de referência entre ingredientes e produtos. Ela cadastra oito supermercados selecionáveis e adiciona vinte receitas com equipamentos, tempo estimado e objetivos. A lista em `GET /api/supermercados` é independente dos preços. Os custos do planejamento usam os preços de referência já cadastrados. A raspagem anexada tem zero preços coletados.
