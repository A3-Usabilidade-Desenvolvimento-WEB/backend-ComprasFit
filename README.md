# ComprasFit — Backend

Backend do ComprasFit em **Next.js + TypeScript**, organizado em **MVC** e seguindo a arquitetura proposta
(Route Handlers + Zod + regras de negócio em `src/lib`). Esta versão **não usa banco de dados**: os dados
ficam em memória e são carregados de um seed.

## Como rodar

```bash
npm install
cp .env.example .env     # opcional
npm run dev              # http://localhost:3000
npm test                 # testes (Vitest)
npm run typecheck
```

> Os dados ficam em memória: tudo o que for salvo (planejamentos, validades) é apagado ao reiniciar o servidor.

## Estrutura (MVC)

```
src/
├── app/api/        # Rotas HTTP (recebem a requisição e chamam o controller)
├── controllers/    # C — validam a entrada, chamam as regras e escolhem o status HTTP
├── models/         # M — entidades, armazenamento em memória e repositórios
│   └── repositories/
├── views/          # V — formatam o JSON devolvido (valores em reais, nomes dos campos)
├── lib/            # Regras de negócio puras (orçamento, embalagens, planejamento, validade, IA)
├── schemas/        # Validação de entrada com Zod
├── data/seed.ts    # Produtos, preços e receitas iniciais
└── types/          # Tipos compartilhados
tests/              # Testes das regras críticas
```

Fluxo de uma requisição: `rota → controller → schema (valida) → lib (calcula) → repository (salva/lê) → view (formata)`.

## Endpoints

| Método | Rota | O que faz |
| --- | --- | --- |
| GET | `/api/produtos` | Lista produtos com o preço mais recente |
| GET | `/api/receitas` | Lista as receitas-base e seus ingredientes |
| POST | `/api/planejamento` | Gera o planejamento e a lista de compras; salva se couber no orçamento |
| GET | `/api/planejamento` | Lista o histórico de planejamentos |
| GET | `/api/planejamento/:id` | Busca um planejamento salvo |
| PATCH | `/api/planejamento/:id/itens/:itemId` | Marca/desmarca item como comprado |
| GET | `/api/validade` | Lista alimentos ordenados por vencimento |
| POST | `/api/validade` | Registra a validade de um alimento |
| POST | `/api/ia/sugestao` | Sugestões culinárias determinísticas, validadas pelo catálogo, com fallback seguro |

### POST `/api/planejamento`

```json
{
  "budget": 300,
  "periodDays": 7,
  "people": 4,
  "mealsPerDay": 2,
  "buyingPreference": "lowest_price",
  "vegetarian": false,
  "recipeIds": ["macarrao-molho-tomate"]
}
```

Obrigatórios: `budget`, `periodDays` (1–31), `people` (1–20). Opcionais: `mealsPerDay` (padrão 2),
`buyingPreference` (`lowest_price` | `variety`, padrão `lowest_price`), `vegetarian` (padrão `false`), `recipeIds`.

| Status | Quando |
| --- | --- |
| 201 | Planejamento coube no orçamento e foi salvo |
| 422 | Não coube: devolve `excess`, `topItems`, `suggestions` e `preview` (nada é salvo) |
| 400 | Entrada inválida (orçamento ≤ 0, 0 pessoas, período inválido...): devolve `details` por campo |

### POST `/api/validade`

```json
{ "productId": "leite", "expirationDate": "2026-10-20" }
```

Aceita `productId` ou `name`. Cada item volta com `daysLeft` e `status` (`expired`, `expiring_soon`, `ok`).

### POST `/api/ia/sugestao`

```json
{ "planningId": "<id do planejamento>" }
```

O provedor local e determinístico não usa LLM, chave de API nem rede. Ele só monta receitas quando todos os
ingredientes necessários estão simultaneamente na lista do planejamento e no catálogo autorizado. Toda saída passa
pela validação CF-17 imediatamente antes da resposta. Quando não há ingredientes suficientes, o provedor falha ou
devolve dados inválidos, a rota devolve receitas-base validadas (`"source": "fallback"`).

## Regras de negócio (`src/lib`)

- Valores são calculados em **centavos** para evitar erro de ponto flutuante e devolvidos em reais.
- `group-ingredients`: soma os ingredientes de todas as refeições, ajustando para o número de pessoas.
- `calculate-packages`: calcula embalagens inteiras e a sobra.
- `calculate-budget` / `validate-budget`: subtotais, total e checagem `total <= orçamento`.
- `generate-planning`: filtra receitas, distribui em rodízio pelos dias e monta a lista de compras.
- `sort-by-expiration`: ordena por vencimento e classifica a situação (perto de vencer = até 3 dias).

## Persistência Supabase

O esquema PostgreSQL versionado está em `supabase/migrations/`. A primeira implantação deve ser feita com a
Supabase CLI e somente então `DATA_STORE=supabase` deve ser configurado no ambiente. Enquanto isso, o modo
`memory` mantém o comportamento atual para desenvolvimento e testes. A validação CF-17 já consulta a tabela
`products` quando o modo Supabase está ativo; os demais repositórios ainda usam memória e serão migrados sem
alterar os contratos HTTP.

## Variáveis de ambiente

| Variável | Uso |
| --- | --- |
| `CORS_ORIGIN` | Origem do frontend liberada nas chamadas à API (padrão: `*`) |
| `DATA_STORE` | `memory` nos testes/desenvolvimento; `supabase` após a migration remota |
| `SUPABASE_URL` | URL do projeto Supabase, somente no servidor |
| `SUPABASE_PUBLISHABLE_KEY` | Chave publicável, reservada para futuro cliente autenticado |
| `SUPABASE_SECRET_KEY` | Chave secreta, somente rotas server-side e scripts administrativos |
