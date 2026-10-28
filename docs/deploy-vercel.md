# Deploy do backend na Vercel

## Variáveis de ambiente

Cadastre em **Production** e, se houver deploy de teste, em **Preview**:

| Nome | Valor | Sigilo |
| --- | --- | --- |
| `DATA_STORE` | `supabase` | Não secreto |
| `SUPABASE_URL` | URL do projeto Supabase | Não secreto |
| `SUPABASE_PUBLISHABLE_KEY` | Chave publicável do Supabase | Pública, mas somente usada no servidor neste backend |
| `SUPABASE_SECRET_KEY` | Chave secreta do Supabase | Secreta; nunca use prefixo `NEXT_PUBLIC_` |
| `CORS_ORIGIN` | URL exata do frontend, por exemplo `https://comprasfit.vercel.app` | Não secreto |

Não configure `SUPABASE_SECRET_KEY` no repositório, no frontend ou em variáveis iniciadas com `NEXT_PUBLIC_`.

## Painel Vercel

1. Crie um projeto e importe o repositório deste backend.
2. Se o backend estiver em uma subpasta, escolha-a como **Root Directory**.
3. Mantenha o preset **Next.js**. O build é `npm run build` e a instalação é `npm ci`.
4. Cadastre as variáveis acima antes do primeiro deploy.
5. Aplique a migration de segurança pendente antes de habilitar dados reais: `npx supabase db push`.
6. Faça o deploy e copie a URL pública gerada. Ela será a base da API do frontend.
7. Atualize `CORS_ORIGIN` com a URL final do frontend e faça um novo deploy do backend.

## Segurança operacional

- As rotas privadas exigem `Authorization: Bearer <JWT do Supabase>`.
- Produtos e receitas são públicos; planejamento, validade e sugestões exigem autenticação.
- CORS aceita somente as origens separadas por vírgula em `CORS_ORIGIN`; não use `*` em produção.
- A chave secreta é usada apenas pelo servidor. Ela ignora RLS, portanto cada nova operação administrativa deve manter validação de usuário no backend.
- A migration `20261028180000_user_ownership_rls.sql` adiciona `user_id`, revoga acesso direto da Data API e define políticas RLS de proprietário. A futura persistência de planejamento e validade deve gravar o `user_id` extraído do JWT.
