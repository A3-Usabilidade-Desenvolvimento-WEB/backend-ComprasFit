import { catalogRepository } from "@/models/repositories/catalog.repository";
import { generatePlanning, type Catalog } from "@/lib/planning/generate-planning";
import { AppError } from "@/lib/errors";
import { formatBRL } from "@/lib/money";
import type { Planning } from "@/models/planning";

type Section = { title: string; detail: string };
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export function summarizePlan(plan: Planning) {
  const { people, periodDays, mealKind, mealsPerDay } = plan.params;
  const total = plan.shoppingList.totalCents;
  const budgetPercent = plan.budgetCents > 0 ? Math.round(total * 100 / plan.budgetCents) : 0;
  const portions = plan.meals.length * people;
  const recipeCounts = new Map<string, number>();
  for (const meal of plan.meals) recipeCounts.set(meal.recipeId, (recipeCounts.get(meal.recipeId) ?? 0) + 1);

  const coverage = mealKind === "snack" ? "lanche" : mealKind === "main" && mealsPerDay === 1 ? "jantar"
    : mealKind === "main" && mealsPerDay === 2 ? "almoço e jantar" : "refeições planejadas";
  const sections: Section[] = [{
    title: "Cobertura e custo médio",
    detail: `O plano tem ${plan.meals.length} refeições (${coverage}) em ${periodDays} ${periodDays === 1 ? "dia" : "dias"}, para ${people} ${people === 1 ? "pessoa" : "pessoas"}. A lista de ${formatBRL(total)} corresponde a ${portions} porções, com média estimada de ${formatBRL(total / Math.max(portions, 1))} por porção.`,
  }, {
    title: "Uso do orçamento",
    detail: `A lista ocupa ${budgetPercent}% do teto de ${formatBRL(plan.budgetCents)}.` +
      (plan.differenceCents > 0 ? ` Restam ${formatBRL(plan.differenceCents)} para os outros gastos.` : ""),
  }];
  const topCost = [...plan.shoppingList.items].filter(item => item.subtotalCents > 0)
    .sort((a, b) => b.subtotalCents - a.subtotalCents).slice(0, 2);
  if (total > 0 && topCost.length) {
    const sum = topCost.reduce((value, item) => value + item.subtotalCents, 0);
    sections.push({
      title: "O que mais pesa na lista",
      detail: topCost.map(item => `${item.productName} (${item.packages} ${item.packages === 1 ? "embalagem" : "embalagens"}, ${formatBRL(item.subtotalCents)})`).join(" e ")
        + ` ${topCost.length === 1 ? "representa" : "representam"} ${Math.round(sum / total * 100)}% do valor estimado.`,
    });
  }

  const repeated = [...recipeCounts.entries()].filter(([, count]) => count > 1).sort((a, b) => b[1] - a[1]);
  const names = new Map(plan.meals.map(meal => [meal.recipeId, meal.recipeName]));
  sections.push({
    title: "Variedade do cardápio",
    detail: `São ${recipeCounts.size} ${recipeCounts.size === 1 ? "receita diferente" : "receitas diferentes"} em ${plan.meals.length} horários.` +
      (repeated.length ? " Entre as mais repetidas estão " + repeated.slice(0, 2).map(([id, count]) => `${names.get(id)} (${count} vezes)`).join(" e ") + "." : " Cada receita aparece uma vez."),
  });
  const leftovers = plan.shoppingList.items.filter(item => item.leftover >= (item.unit === "un" ? 1 : 0.1))
    .sort((a, b) => b.leftover / b.packageSize * b.unitPriceCents - a.leftover / a.packageSize * a.unitPriceCents).slice(0, 2);
  if (leftovers.length) {
    sections.push({
      title: "Sobra prevista das embalagens",
      detail: leftovers.map(item => `${item.productName}: ${number.format(item.leftover)} ${item.unit}`).join(" · ") +
        ". São quantidades estimadas após preparar as receitas do plano.",
    });
  }
  return { sections, portions, budgetPercent, recipeCounts, repeated, leftovers };
}

export async function previewMealSwap(plan: Planning, eligibleIds: string[], recipeCounts: ReadonlyMap<string, number>): Promise<Section | null> {
  if (!eligibleIds.length || plan.meals.length !== plan.params.periodDays * plan.params.mealsPerDay) return null;
  const data = await catalogRepository.load();
  const catalog: Catalog = {
    products: new Map(data.products.map(product => [product.id, product])),
    prices: new Map(data.prices.map(price => [price.productId, price])),
  };
  const currentIds = plan.meals.map(meal => meal.recipeId);
  const repeats = Math.max(...currentIds.map(id => recipeCounts.get(id) ?? 0));
  const index = currentIds.findIndex(id => recipeCounts.get(id) === repeats);
  const currentMeal = plan.meals[index];
  const allowed = new Set(eligibleIds);
  const candidates = data.recipes.filter(recipe => allowed.has(recipe.id) && !recipeCounts.has(recipe.id));
  if (!candidates.length) return null;

  let best: { name: string; total: number } | null = null;
  for (const recipe of candidates) {
    const recipeIds = currentIds.map((id, slot) => slot === index ? recipe.id : id);
    try {
      const draft = generatePlanning({ ...plan.params, recipeIds, mealRecipeIds: recipeIds }, data.recipes, catalog);
      const newTotal = draft.shoppingList.totalCents;
      if (draft.fitsBudget && (!best || newTotal < best.total)) best = { name: recipe.name, total: newTotal };
    } catch (error) {
      if (!(error instanceof AppError)) throw error;
    }
  }
  if (!best) return null;
  const day = plan.params.dayLabels?.[currentMeal.day - 1] ?? `Dia ${currentMeal.day}`;
  const slot = plan.params.mealKind === "main" && plan.params.mealsPerDay === 2 ? (currentMeal.slot === 1 ? ", almoço" : ", jantar") : "";
  return {
    title: "Troca simulada",
    detail: `${day}${slot}: trocar ${currentMeal.recipeName} por ${best.name} deixaria a lista em ${formatBRL(best.total)} pelos preços do catálogo. O total salvo é ${formatBRL(plan.shoppingList.totalCents)}.`,
  };
}
