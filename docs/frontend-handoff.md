# Integração do frontend com a API ComprasFit

## Endereço da API

Configure no `.env` do frontend:

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://<backend-vercel>.vercel.app
NEXT_PUBLIC_SUPABASE_URL=<URL do projeto Supabase>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<chave publicável do Supabase>
```

Use somente a chave **publicável** no frontend. Nunca use `SUPABASE_SECRET_KEY` ou qualquer chave `service_role` no navegador.

## Autenticação

O frontend deve autenticar o usuário com Supabase Auth e enviar o access token a cada chamada privada.

```ts
const { data: { session } } = await supabase.auth.getSession();
if (!session?.access_token) throw new Error("Usuário não autenticado");

const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/planejamento`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  },
  body: JSON.stringify({
    budget: 300,
    periodDays: 7,
    people: 2,
  }),
});

if (!response.ok) throw new Error("Falha ao criar planejamento");
const planning = await response.json();
```

## Rotas

| Rota | Autenticação |
| --- | --- |
| `GET /api/produtos` | Não exige token |
| `GET /api/receitas` | Não exige token |
| `/api/planejamento/*` | JWT obrigatório |
| `/api/validade` | JWT obrigatório |
| `POST /api/ia/sugestao` | JWT obrigatório |

## CORS

Informe ao responsável pelo backend a URL final do deploy do frontend. Ela será cadastrada em `CORS_ORIGIN` no backend. Enquanto isso não ocorrer, o navegador bloqueará chamadas de produção por CORS.

Também cadastre essa URL no Supabase Auth como URL de redirecionamento autorizada, caso o frontend use login, recuperação de senha ou OAuth.
