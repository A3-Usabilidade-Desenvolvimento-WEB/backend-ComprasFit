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

## Regras de negócio (`src/lib`)

- Valores são calculados em **centavos** para evitar erro de ponto flutuante e devolvidos em reais.
- `group-ingredients`: soma os ingredientes de todas as refeições, ajustando para o número de pessoas.
- `calculate-packages`: calcula embalagens inteiras e a sobra.
- `calculate-budget` / `validate-budget`: subtotais, total e checagem `total <= orçamento`.
- `generate-planning`: filtra receitas, distribui em rodízio pelos dias e monta a lista de compras.

## Trocar o armazenamento em memória por banco

Só a camada `src/models/repositories/` acessa os dados. Para usar Prisma + PostgreSQL, reimplemente os
métodos de cada repositório com o `PrismaClient` (mantendo as mesmas assinaturas). Controllers, views e regras
não precisam mudar (os repositórios passariam a ser assíncronos).

## Variáveis de ambiente

| Variável | Uso |
| --- | --- |
| `CORS_ORIGIN` | Origem do frontend liberada nas chamadas à API (padrão: `*`) |
