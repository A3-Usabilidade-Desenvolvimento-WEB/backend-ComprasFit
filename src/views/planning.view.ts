import { centsToReais } from "@/lib/money";
import type { Adjustments } from "@/lib/planning/suggest-adjustments";
import type { Planning, PlanningDraft, ShoppingItem } from "@/models/planning";

// Formata um item da lista de compras (valores em reais)
export function presentShoppingItem(item: ShoppingItem) {
  return {
    id: item.id,
    productId: item.productId,
    name: item.productName,
    category: item.category,
    unit: item.unit,
    quantityNeeded: item.quantityNeeded,
    packageSize: item.packageSize,
    packages: item.packages,
    leftover: item.leftover,
    unitPrice: centsToReais(item.unitPriceCents),
    subtotal: centsToReais(item.subtotalCents),
    purchased: item.purchased,
  };
}

// Formata o conteúdo comum de um planejamento (salvo ou não)
function presentDraft(draft: PlanningDraft) {
  return {
    params: draft.params,
    budget: centsToReais(draft.budgetCents),
    total: centsToReais(draft.shoppingList.totalCents),
    difference: centsToReais(draft.differenceCents),
    fitsBudget: draft.fitsBudget,
    meals: draft.meals,
    shoppingList: {
      items: draft.shoppingList.items.map(presentShoppingItem),
      total: centsToReais(draft.shoppingList.totalCents),
    },
  };
}

// Formata um planejamento salvo
export function presentPlanning(planning: Planning) {
  return { id: planning.id, createdAt: planning.createdAt, ...presentDraft(planning) };
}

// Formata um resumo do planejamento para a lista do histórico
export function presentPlanningSummary(planning: Planning) {
  return {
    id: planning.id,
    createdAt: planning.createdAt,
    budget: centsToReais(planning.budgetCents),
    total: centsToReais(planning.shoppingList.totalCents),
    periodDays: planning.params.periodDays,
    people: planning.params.people,
    itemsPurchased: planning.shoppingList.items.filter((item) => item.purchased).length,
    itemsTotal: planning.shoppingList.items.length,
  };
}

// Formata a resposta de planejamento que estourou o orçamento
export function presentOverBudget(draft: PlanningDraft, adjustments: Adjustments) {
  return {
    error: "O planejamento não cabe no orçamento informado",
    excess: centsToReais(adjustments.excessCents),
    topItems: adjustments.topItems.map((item) => ({
      name: item.name,
      subtotal: centsToReais(item.subtotalCents),
    })),
    suggestions: adjustments.suggestions,
    preview: presentDraft(draft),
  };
}
