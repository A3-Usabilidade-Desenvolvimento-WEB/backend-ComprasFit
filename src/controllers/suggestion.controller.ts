import { handleError } from "@/controllers/handle-error";
import { catalogRepository } from "@/models/repositories/catalog.repository";
import { planningRepository } from "@/models/repositories/planning.repository";
import { suggestionInputSchema } from "@/schemas/ai.schema";
import type { ControllerResponse } from "@/types/http";
import { presentError } from "@/views/error.view";
import { presentSuggestions } from "@/views/suggestion.view";

const pageSize = 3;

export async function suggestRecipes(input: unknown, userId: string): Promise<ControllerResponse> {
  try {
    const { planningId, offset, eligibleRecipeIds } = suggestionInputSchema.parse(input);
    const planning = await planningRepository.findById(planningId, userId);
    if (!planning) return { status: 404, body: presentError("Planejamento não encontrado") };

    const { recipes, products } = await catalogRepository.load();
    const productNames = new Map(products.map(product => [product.id, product.name]));
    const inPlan = new Set(planning.meals.map(meal => meal.recipeId));
    const inList = new Set(planning.shoppingList.items.map(item => item.productId));
    const eligible = eligibleRecipeIds ? new Set(eligibleRecipeIds) : null;
    const suggestions = recipes
      .filter(recipe =>
        !inPlan.has(recipe.id) &&
        (!eligible || eligible.has(recipe.id)) &&
        (!planning.params.vegetarian || recipe.vegetarian) &&
        recipe.ingredients.length > 0 &&
        recipe.ingredients.every(ingredient => productNames.has(ingredient.productId)))
      .map(recipe => ({
        recipeId: recipe.id,
        name: recipe.name,
        ingredients: recipe.ingredients.map(ingredient => productNames.get(ingredient.productId)!),
        steps: recipe.basePreparation,
        ingredientsInList: recipe.ingredients.filter(ingredient => inList.has(ingredient.productId)).length,
      }))
      .sort((a, b) =>
        b.ingredientsInList / b.ingredients.length - a.ingredientsInList / a.ingredients.length ||
        (a.ingredients.length - a.ingredientsInList) - (b.ingredients.length - b.ingredientsInList) ||
        a.recipeId.localeCompare(b.recipeId));
    const nextOffset = offset + pageSize < suggestions.length ? offset + pageSize : null;
    return { status: 200, body: presentSuggestions(suggestions.slice(offset, offset + pageSize), nextOffset) };
  } catch (error) {
    return handleError(error);
  }
}
