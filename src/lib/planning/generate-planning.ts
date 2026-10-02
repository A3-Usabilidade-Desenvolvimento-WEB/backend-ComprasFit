import { calculateSubtotal, calculateTotal } from "@/lib/budget/calculate-budget";
import { calculatePackages } from "@/lib/budget/calculate-packages";
import { checkBudget } from "@/lib/budget/validate-budget";
import { AppError } from "@/lib/errors";
import { reaisToCents } from "@/lib/money";
import { groupIngredients } from "@/lib/planning/group-ingredients";
import type { PlanningDraft, PlanningMeal, PlanningParams, ShoppingItem } from "@/models/planning";
import type { Price } from "@/models/price";
import type { Product } from "@/models/product";
import type { Recipe } from "@/models/recipe";

export interface Catalog {
  products: Map<string, Product>;
  prices: Map<string, Price>;
}

interface ScheduledMeal {
  day: number;
  slot: number;
  recipe: Recipe;
}

// Calcula o custo proporcional de uma porção da receita (em centavos)
function costPerServing(recipe: Recipe, catalog: Catalog): number {
  const total = recipe.ingredients.reduce((sum, ingredient) => {
    const product = catalog.products.get(ingredient.productId);
    const price = catalog.prices.get(ingredient.productId);
    if (!product || !price) return sum;
    return sum + (ingredient.quantity / product.packageSize) * price.priceCents;
  }, 0);
  return total / recipe.servings;
}

// Filtra as receitas pelas preferências e ordena conforme a preferência de compra
export function selectRecipes(params: PlanningParams, recipes: Recipe[], catalog: Catalog): Recipe[] {
  let selected = recipes;

  if (params.recipeIds && params.recipeIds.length > 0) {
    const ids = new Set(params.recipeIds);
    const unknown = params.recipeIds.filter((id) => !recipes.some((recipe) => recipe.id === id));
    if (unknown.length > 0) {
      throw new AppError(422, `Receitas não encontradas: ${unknown.join(", ")}`);
    }
    selected = selected.filter((recipe) => ids.has(recipe.id));
  }

  if (params.vegetarian) {
    selected = selected.filter((recipe) => recipe.vegetarian);
  }

  if (selected.length === 0) {
    throw new AppError(422, "Nenhuma receita disponível para as preferências informadas");
  }

  if (params.buyingPreference === "lowest_price") {
    return [...selected].sort((a, b) => costPerServing(a, catalog) - costPerServing(b, catalog));
  }
  return selected;
}

// Distribui as receitas pelos dias e refeições em rodízio
export function scheduleMeals(params: PlanningParams, recipes: Recipe[]): ScheduledMeal[] {
  const totalMeals = params.periodDays * params.mealsPerDay;
  const meals: ScheduledMeal[] = [];

  for (let index = 0; index < totalMeals; index++) {
    meals.push({
      day: Math.floor(index / params.mealsPerDay) + 1,
      slot: (index % params.mealsPerDay) + 1,
      recipe: recipes[index % recipes.length],
    });
  }
  return meals;
}

// Transforma as quantidades necessárias em itens da lista de compras
function buildShoppingItems(needs: Map<string, number>, catalog: Catalog): ShoppingItem[] {
  const items: Omit<ShoppingItem, "id">[] = [];

  for (const [productId, quantityNeeded] of needs) {
    const product = catalog.products.get(productId);
    if (!product) throw new AppError(422, `Produto não cadastrado: ${productId}`);

    const price = catalog.prices.get(productId);
    if (!price) throw new AppError(422, `Sem preço cadastrado para ${product.name}`);

    const { packages, leftover } = calculatePackages(quantityNeeded, product.packageSize);
    items.push({
      productId,
      productName: product.name,
      category: product.category,
      unit: product.unit,
      quantityNeeded,
      packageSize: product.packageSize,
      packages,
      leftover,
      unitPriceCents: price.priceCents,
      subtotalCents: calculateSubtotal(packages, price.priceCents),
      purchased: false,
    });
  }

  // Ordena por categoria e nome para facilitar a compra no mercado
  items.sort(
    (a, b) => a.category.localeCompare(b.category, "pt-BR") || a.productName.localeCompare(b.productName, "pt-BR"),
  );
  return items.map((item, index) => ({ id: `item-${index + 1}`, ...item }));
}

// Gera o planejamento completo: refeições, lista de compras, total e checagem do orçamento
export function generatePlanning(params: PlanningParams, allRecipes: Recipe[], catalog: Catalog): PlanningDraft {
  const recipes = selectRecipes(params, allRecipes, catalog);
  const scheduled = scheduleMeals(params, recipes);

  const needs = groupIngredients(scheduled.map(({ recipe }) => ({ recipe, people: params.people })));
  const items = buildShoppingItems(needs, catalog);
  const totalCents = calculateTotal(items);

  const budgetCents = reaisToCents(params.budget);
  const check = checkBudget(totalCents, budgetCents);

  const meals: PlanningMeal[] = scheduled.map(({ day, slot, recipe }) => ({
    day,
    slot,
    recipeId: recipe.id,
    recipeName: recipe.name,
  }));

  return {
    params,
    budgetCents,
    meals,
    shoppingList: { items, totalCents },
    fitsBudget: check.fits,
    differenceCents: check.differenceCents,
  };
}
