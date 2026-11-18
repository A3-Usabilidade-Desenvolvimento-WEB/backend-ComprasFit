# Contrato do ComprasFit com o Expo

Base de produção `https://backend-compras-fit.vercel.app`. Em desenvolvimento, `http://localhost:3000`. Os caminhos abaixo incluem `/api`. Os valores monetários HTTP são números em reais. O banco e o cálculo interno usam centavos inteiros.

## Transporte e autenticação

Todas as rotas aceitam `OPTIONS` sem token e respondem 204 sem corpo. A origem liberada recebe `Access-Control-Allow-Origin` específico e `Vary: Origin`. A lista de métodos CORS inclui GET, POST, PUT, PATCH, DELETE e OPTIONS. As operações implementadas estão na tabela. Nenhuma rota lê parâmetros de query. Os parâmetros de caminho são IDs opacos. Envie `Accept: application/json` e, para requisições com corpo, `Content-Type: application/json`.

O Expo usa a chave publicável com o SDK Supabase Auth para cadastro com nome, confirmação por e-mail, login por senha, sessão de visitante, alteração de nome, renovação e saída. Cada operação privada da API exige `Authorization: Bearer <access_token>`. O servidor valida o token via Auth e extrai o proprietário dele.

| Método e caminho | Acesso | Corpo JSON | Resposta de sucesso |
| --- | --- | --- | --- |
| GET /api/produtos | Público | — | 200, Produto[] |
| GET /api/receitas | Público | — | 200, Receita[] |
| GET /api/planejamento | Privado | — | 200, Resumo[], mais recente primeiro |
| POST /api/planejamento | Privado | EntradaPlano | 201, Plano |
| GET /api/planejamento/:id | Privado | — | 200, Plano |
| PATCH /api/planejamento/:id/itens/:itemId | Privado | `{ purchased: boolean }` | 200, Item |
| GET /api/validade | Privado | — | 200, Validade[], por vencimento |
| POST /api/validade | Privado | `{ expirationDate, productId?, name? }` | 201, Validade |
| POST /api/ia/sugestao | Privado | `{ planningId: string, offset?: number, eligibleRecipeIds?: string[] }` | 200, `{ source, suggestions, nextOffset }` |

## Campos

| Tipo | Campos e unidades |
| --- | --- |
| Produto | `id, name, category, unit, packageSize, price`. Unidade em g, ml ou un. Preço é nulo ou `{ value, store, updatedAt }`. |
| Receita | `id, name, servings, vegetarian, steps: string[], preferences: { appliances, restrictions, goals }, ingredients: [{ productId, name, quantity, unit }]`. Os três atributos de preferências são listas de textos. As restrições indicam compatibilidade cadastrada. As quantidades são para todas as porções da receita-base. A unidade pode ser nula. |
| EntradaPlano | `budget` positivo até 100.000, `periodDays` inteiro de 1 a 31, `people` inteiro de 1 a 20. Opcionais: `mealsPerDay` inteiro de 1 a 4 (padrão 2), `buyingPreference` igual a `lowest_price` (padrão) ou `variety`, `vegetarian` booleano (padrão falso), `recipeIds: string[]` para restringir o catálogo, `dayLabels: string[]` com um rótulo por dia e `mealRecipeIds: string[]` com uma receita por refeição na ordem desejada. |
| Plano | `id, createdAt, params, budget, total, difference, fitsBudget, meals: [{ day, slot, recipeId, recipeName }], shoppingList: { items: Item[], total }`. Dia e refeição começam em 1. A diferença é orçamento menos total. |
| Item | `id, productId, name, category, unit, quantityNeeded, packageSize, packages, leftover, unitPrice, subtotal, purchased`. O preço unitário é por embalagem. O ID do item é local ao plano. |
| Resumo | `id, createdAt, budget, total, periodDays, people, itemsPurchased, itemsTotal`. |
| Validade | `id, name, productId, expirationDate, daysLeft, status, registeredAt`. Ao registrar, informe uma data real AAAA-MM-DD e pelo menos um de nome (1–100 caracteres) ou ID do produto. Na resposta o ID pode ser nulo. Situações: `expired`, `expiring_soon` (0 a 3 dias) e `ok`. |
| Sugestões | `source: "catalog"`, `suggestions: [{ recipeId, name, ingredients: string[], steps: string[], ingredientsInList }]` e `nextOffset` nulo na última página. A contagem compara produtos com a lista do plano. |

## Erros

400 retorna `{ error, details: [{ field, message }] }` para corpos inválidos. 401 indica token ausente ou inválido. 404 indica produto, item ou plano inexistente ou plano de outro usuário. 422 indica incompatibilidade de receitas, preço ausente ou excesso de orçamento. Neste último caso o corpo contém `error, excess, topItems: [{ name, subtotal }], suggestions: string[], preview`. A prévia contém os mesmos campos de cálculo do plano salvo, sem ID e data. Nenhuma linha é gravada para um plano recusado. Falhas internas retornam 500 com `{ error }`. Uma indisponibilidade informada pelo serviço de autenticação retorna 503. O Expo tenta renovar a sessão uma vez após um 401.

## Telas e estado do frontend

| Tela ou contexto | Origem dos dados e operações |
| --- | --- |
| App / AppState | A sessão define a conta ativa. Carrega receitas, produtos, histórico e detalhe do último plano. Se a API falha, oferece nova tentativa. |
| Conta | Supabase Auth recebe e-mail e senha ou cria visitante. O SDK persiste e renova a sessão. O login antigo, gravado no aparelho, era uma conta de demonstração. |
| Apresentação e configuração | Nome e preferências ficam por conta no aparelho. Lojas vêm dos preços cadastrados. Dias, orçamento, pessoas, objetivos, restrições e aparelhos determinam o corpo do POST. O Expo planeja um jantar por dia selecionado. A loja preferida é informativa. |
| Início | Usa total, refeições e compras do último plano. O botão de sugestões consulta a rota de IA sob demanda. |
| Receita e favoritos | Mostram o preparo e os ingredientes da API, escalados pelas porções. A troca envia um novo plano com a ordem exata de refeições e recalcula as compras. Favoritos referenciam os IDs reais. |
| Compras | Mostra embalagens, subtotais e marcação do plano. O PATCH só altera a tela após confirmação da API. Compartilhamento e download usam a mesma lista. A seção de validades lista e registra alimentos no backend. |
| Preferências e configurações | Tema, início da semana, opção de idioma e favoritos são locais por conta. Redefinir essas preferências preserva o histórico do servidor. Lembretes e traduções completas seguem fora da versão atual. |

As imagens e opções de interface são recursos de apresentação. A API fornece os dados de negócio. O catálogo inicial tem preços acadêmicos datados e não consulta supermercados em tempo real.

## IA no projeto acadêmico

O endpoint recomenda alternativas do catálogo por página. A ordenação prioriza o reaproveitamento de produtos da lista do usuário e exclui as receitas já planejadas.

Para experimentar geração de texto, o Google oferece entrada e saída gratuitas no Free Tier do Gemini 3.5 Flash-Lite, com cotas por projeto. Uma integração futura pode enviar apenas nomes de ingredientes, verificar se a resposta usa somente os ingredientes recebidos e identificar o provedor real na resposta. O Google pode usar o conteúdo da modalidade gratuita para melhorar produtos. [Preços da Gemini API](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash-lite) · [Limites de uso](https://ai.google.dev/gemini-api/docs/rate-limits).

## Arquivos desta integração

### Frontend

Criados (7)

```text
.env
.env.example
metro.config.js
src/screens/Expirations.tsx
src/services/api.ts
src/services/auth.ts
vercel.json
```

Modificados (18)

```text
App.tsx
README.md
app.json
package-lock.json
package.json
scripts/test_web.py
src/components/RecipeCard.tsx
src/data/images.ts
src/data/planner.test.ts
src/data/planner.ts
src/data/recipes.ts
src/screens/Account.tsx
src/screens/Home.tsx
src/screens/Onboarding.tsx
src/screens/RecipeDetails.tsx
src/screens/Settings.tsx
src/screens/Shopping.tsx
src/state/AppState.tsx
```

### Backend

Criados (3)

```text
src/data/recipe-preferences.ts
supabase/migrations/20261118000100_planning_runtime.sql
supabase/migrations/20261118000200_academic_catalog.sql
```

Modificados (36)

```text
.env.example
README.md
docs/catalogo-supabase.md
docs/deploy-vercel.md
docs/frontend-handoff.md
package-lock.json
package.json
src/app/api/ia/sugestao/route.ts
src/app/api/planejamento/[id]/itens/[itemId]/route.ts
src/app/api/planejamento/[id]/route.ts
src/app/api/planejamento/route.ts
src/app/api/produtos/route.ts
src/app/api/receitas/route.ts
src/app/api/validade/route.ts
src/controllers/expiration.controller.ts
src/controllers/planning.controller.ts
src/controllers/product.controller.ts
src/controllers/recipe.controller.ts
src/controllers/suggestion.controller.ts
src/lib/auth.ts
src/lib/cors.ts
src/lib/planning/generate-planning.ts
src/lib/supabase.ts
src/models/planning.ts
src/models/repositories/catalog.repository.ts
src/models/repositories/expiration.repository.ts
src/models/repositories/planning.repository.ts
src/models/store.ts
src/schemas/planning.schema.ts
src/views/recipe.view.ts
tests/catalog.controller.test.ts
tests/cors.test.ts
tests/expiration.controller.test.ts
tests/planning.controller.test.ts
tests/suggestion.controller.test.ts
tests/suggestion.route.test.ts
```
