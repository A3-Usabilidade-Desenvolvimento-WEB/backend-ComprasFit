# Deploy do backend

Use o repositório do backend como raiz do projeto Vercel e o preset Next.js. O `vercel.json` usa `npm ci` e `npm run build`. O App Router publica as sete rotas como funções. Confira o deploy em `/api/receitas`. A raiz do domínio não tem página de apresentação.

| Variável na Vercel | Valor |
| --- | --- |
| DATA_STORE | `supabase` |
| SUPABASE_URL | URL do mesmo projeto usado no Expo |
| SUPABASE_PUBLISHABLE_KEY | Chave publicável para validar a sessão |
| SUPABASE_SECRET_KEY | Chave secreta do servidor para o banco |
| CORS_ORIGIN | Opcional. Origens extras exatas, separadas por vírgulas. A configuração padrão inclui `https://comprasfit-swart.vercel.app,http://localhost:8081,http://localhost:19006`. |

1. No Supabase Auth, configure o provedor de e-mail, a Site URL do frontend e as URLs autorizadas de redirecionamento para os ambientes utilizados. Ative o login anônimo para habilitar “Entrar como visitante”.
2. No PowerShell, use o executável `npx.cmd`. Em macOS ou Linux, use `npx`. Autentique a CLI com `npx.cmd supabase login` e confirme o projeto Supabase vinculado. Na raiz do backend, confira as migrations pendentes com `npx.cmd supabase db push --remote --dry-run` e aplique-as com `npx.cmd supabase db push --remote`. Elas criam o armazenamento privado por usuário e carregam o catálogo acadêmico com embalagens, receitas e preços.
3. Para disponibilizar também os nomes comerciais do CSV na validação de sugestões, execute `node --env-file=.env.local scripts/import-catalog-to-supabase.mjs` com a URL e a chave secreta no arquivo local. A chave secreta fica exclusivamente no backend.
4. Cadastre as variáveis em Production e nos ambientes de Preview utilizados. Faça o deploy do backend antes de publicar o Expo, que consome os novos campos de receitas. Alterações nas variáveis precisam de um novo deploy.
5. Para desenvolvimento, copie `.env.example` para `.env.local`. `DATA_STORE=memory` usa dados de processo e continua exigindo Supabase Auth nas rotas privadas. Para testar a persistência, use `DATA_STORE=supabase` com um projeto de desenvolvimento migrado. Inicie a API com `npm run dev`.

O provedor de sugestões atual funciona sem chave de IA.
