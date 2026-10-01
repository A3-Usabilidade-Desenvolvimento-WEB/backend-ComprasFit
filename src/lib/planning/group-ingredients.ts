import type { Recipe } from "@/models/recipe";

export interface MealOccurrence {
  recipe: Recipe;
  people: number;
}

// Soma os ingredientes de todas as refeições por produto, ajustando para o número de pessoas
export function groupIngredients(meals: MealOccurrence[]): Map<string, number> {
  const totals = new Map<string, number>();

  for (const { recipe, people } of meals) {
    for (const ingredient of recipe.ingredients) {
      const quantity = (ingredient.quantity * people) / recipe.servings;
      totals.set(ingredient.productId, (totals.get(ingredient.productId) ?? 0) + quantity);
    }
  }

  // Arredonda para cima para nunca faltar ingrediente
  for (const [productId, quantity] of totals) {
    totals.set(productId, Math.ceil(quantity - 1e-9));
  }
  return totals;
}
