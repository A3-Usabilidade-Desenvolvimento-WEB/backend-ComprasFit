import { formatBRL } from "@/lib/money";
import type { PlanningDraft } from "@/models/planning";

export interface Adjustments {
  excessCents: number;
  topItems: { name: string; subtotalCents: number }[];
  suggestions: string[];
}

// Explica por que o planejamento não coube e sugere o que ajustar
export function suggestAdjustments(draft: PlanningDraft): Adjustments {
  const { params, budgetCents, shoppingList } = draft;
  const totalCents = shoppingList.totalCents;
  const ratio = budgetCents / totalCents;

  const topItems = [...shoppingList.items]
    .sort((a, b) => b.subtotalCents - a.subtotalCents)
    .slice(0, 3)
    .map((item) => ({ name: item.productName, subtotalCents: item.subtotalCents }));

  const suggestions = [`Aumentar o orçamento para pelo menos ${formatBRL(totalCents)}.`];

  const maxDays = Math.floor(params.periodDays * ratio);
  if (maxDays >= 1 && maxDays < params.periodDays) {
    suggestions.push(`Reduzir o período para cerca de ${maxDays} dia(s).`);
  }

  const maxPeople = Math.floor(params.people * ratio);
  if (maxPeople >= 1 && maxPeople < params.people) {
    suggestions.push(`Reduzir o número de pessoas para ${maxPeople}.`);
  }

  return { excessCents: -draft.differenceCents, topItems, suggestions };
}
