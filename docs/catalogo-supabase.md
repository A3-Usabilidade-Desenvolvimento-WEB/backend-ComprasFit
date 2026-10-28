# Catálogo de produtos no Supabase

O catálogo usa a tabela `products` definida em `supabase/migrations/`. O backend consulta essa tabela na validação
CF-17 somente quando `DATA_STORE=supabase`; fora desse modo, os testes e o desenvolvimento usam o CSV local.

Depois de aplicar as migrations, defina `SUPABASE_URL` e `SUPABASE_SECRET_KEY` em um ambiente local seguro. Depois execute:

```bash
node scripts/import-catalog-to-supabase.mjs
```

O índice único `normalized_name` e `resolution=merge-duplicates` tornam a importação idempotente. Nunca exponha a
chave `SUPABASE_SECRET_KEY` no frontend ou em variáveis com prefixo `NEXT_PUBLIC_`.

Os repositórios de planejamento, preço, receita e validade continuam em memória nesta primeira migração de runtime.
O esquema para eles já está versionado; a conversão desses repositórios para operações assíncronas é o próximo passo.
