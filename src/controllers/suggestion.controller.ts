import { handleError } from "@/controllers/handle-error";
import { requestAiSuggestions } from "@/lib/ai";
import { planningRepository } from "@/models/repositories/planning.repository";
import { productRepository } from "@/models/repositories/product.repository";
import { recipeRepository } from "@/models/repositories/recipe.repository";
import { suggestionInputSchema } from "@/schemas/ai.schema";
import type { ControllerResponse } from "@/types/http";
import type { RecipeSuggestion } from "@/types/suggestion";
import { presentError } from "@/views/error.view";
import { presentSuggestions } from "@/views/suggestion.view";

// Gera sugestões com a IA usando só os ingredientes do planejamento; sem resposta válida, usa as receitas-base
export async function suggestRecipes(input: unknown): Promise<ControllerResponse> {
  try {
    const { planningId } = suggestionInputSchema.parse(input);

    const planning = planningRepository.findById(planningId);
    if (!planning) return { status: 404, body: presentError("Planejamento não encontrado") };

    const allowedIngredients = planning.shoppingList.items.map((item) => item.productName);

    const aiSuggestions = await requestAiSuggestions(allowedIngredients);
    if (aiSuggestions) {
      return { status: 200, body: presentSuggestions("ai", aiSuggestions) };
    }

    return { status: 200, body: presentSuggestions("fallback", baseSuggestions(planning.meals.map((m) => m.recipeId))) };
  } catch (error) {
    return handleError(error);
  }
}

// Monta as sugestões a partir das receitas-base usadas no planejamento
function baseSuggestions(recipeIds: string[]): RecipeSuggestion[] {
  const uniqueIds = [...new Set(recipeIds)];
  const suggestions: RecipeSuggestion[] = [];

  for (const id of uniqueIds) {
    const recipe = recipeRepository.findById(id);
    if (!recipe) continue;
    suggestions.push({
      name: recipe.name,
      ingredients: recipe.ingredients.map(
        (ingredient) => productRepository.findById(ingredient.productId)?.name ?? ingredient.productId,
      ),
      steps: recipe.basePreparation,
    });
  }
  return suggestions;
}
