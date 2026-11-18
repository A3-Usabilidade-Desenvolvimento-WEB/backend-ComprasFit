import { isVeganRecipe } from "@/data/recipe-preferences";
import { calculateSubtotal, calculateTotal } from "@/lib/budget/calculate-budget";
import { calculatePackages } from "@/lib/budget/calculate-packages";
import { checkBudget } from "@/lib/budget/validate-budget";
import { AppError } from "@/lib/errors";
import { reaisToCents } from "@/lib/money";
import { mealKind } from "@/lib/planning/meal-kind";
import { hasProteinMain, isMainProtein } from "@/lib/planning/protein";
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
    if (params.mealKind) {
      const order = new Map([...ids].map((id, index) => [id, index]));
      selected.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
    }
  }

  if (params.vegetarian) {
    selected = selected.filter((recipe) => recipe.vegetarian);
  }

  if (params.vegan) {
    selected = selected.filter(isVeganRecipe);
  }

  if (params.requireProteinMain) {
    selected = selected.filter(recipe => hasProteinMain(recipe, catalog.products));
  }

  if (params.mealKind) {
    selected = selected.filter(recipe => mealKind(recipe, catalog.products) === params.mealKind);
  }

  if (selected.length === 0) {
    throw new AppError(422, "Nenhuma receita disponível para as preferências informadas");
  }

  if (params.buyingPreference === "lowest_price") {
    return [...selected].sort((a, b) => costPerServing(a, catalog) - costPerServing(b, catalog));
  }
  return params.mealKind ? orderForVariety(selected, catalog) : selected;
}

// Distribui as receitas pelos dias e refeições em rodízio
export function scheduleMeals(params: PlanningParams, recipes: Recipe[]): ScheduledMeal[] {
  const totalMeals = params.periodDays * params.mealsPerDay;
  const meals: ScheduledMeal[] = [];

  for (let index = 0; index < totalMeals; index++) {
    const id = params.mealRecipeIds?.[index];
    const recipe = id ? recipes.find(candidate => candidate.id === id) : recipes[index % recipes.length];
    if (!recipe) throw new AppError(422, "Receita incompatível com o planejamento");
    meals.push({
      day: Math.floor(index / params.mealsPerDay) + 1,
      slot: (index % params.mealsPerDay) + 1,
      recipe,
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

function orderForVariety(recipes: Recipe[], catalog: Catalog): Recipe[] {
  const usedBySource = new Map<string, number>();
  const ranked = recipes.map(recipe => {
    const source = recipe.ingredients.find(ingredient =>
      isMainProtein(ingredient, catalog.products.get(ingredient.productId)))?.productId ?? "";
    const repeats = usedBySource.get(source) ?? 0;
    usedBySource.set(source, repeats + 1);
    return { recipe, repeats };
  });
  return ranked.sort((a, b) => a.repeats - b.repeats).map(entry => entry.recipe);
}

function planBasket(scheduled: ScheduledMeal[], people: number, catalog: Catalog) {
  const needs = groupIngredients(scheduled.map(({ recipe }) => ({ recipe, people })));
  const items = buildShoppingItems(needs, catalog);
  return { scheduled, items, totalCents: calculateTotal(items) };
}

function findAffordableBasket(params: PlanningParams, recipes: Recipe[], catalog: Catalog, budgetCents: number) {
  let best = planBasket(scheduleMeals(params, recipes), params.people, catalog);
  if (!params.mealKind || params.mealRecipeIds || best.totalCents <= budgetCents) return best;

  // Search progressively smaller groups. Compare complete baskets, including package rounding.
  const maxDistinct = Math.min(recipes.length, params.periodDays * params.mealsPerDay);
  const circular = [...recipes, ...recipes];
  for (let size = maxDistinct; size >= 1; size--) {
    for (let start = 0; start < recipes.length; start++) {
      const candidate = planBasket(scheduleMeals(params, circular.slice(start, start + size)), params.people, catalog);
      if (candidate.totalCents <= budgetCents) return candidate;
      if (candidate.totalCents < best.totalCents) best = candidate;
    }
  }
  return best;
}

// Gera o planejamento completo: refeições, lista de compras, total e checagem do orçamento
export function generatePlanning(params: PlanningParams, allRecipes: Recipe[], catalog: Catalog): PlanningDraft {
  const recipes = selectRecipes(params, allRecipes, catalog);
  const budgetCents = reaisToCents(params.budget);
  const { scheduled, items, totalCents } = findAffordableBasket(params, recipes, catalog, budgetCents);
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
