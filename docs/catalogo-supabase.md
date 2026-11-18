# Catálogo no Supabase

A migration `20261118000200_academic_catalog.sql` fornece sete receitas e dezessete produtos com embalagens e preços de referência. A função `comprasfit_catalog` carrega os produtos ativos com embalagem utilizável, seus preços recentes e as receitas com ingredientes correspondentes. As sugestões validam nomes no CSV e, em modo persistente, também verificam se o ingrediente da lista está ativo na tabela de produtos.

O script `scripts/import-catalog-to-supabase.mjs` importa os nomes comerciais e as categorias do CSV. Produtos importados sem tamanho de embalagem permanecem no catálogo de nomes autorizados. O procedimento está em [Deploy do backend](deploy-vercel.md).
