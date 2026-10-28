import { handleError } from "@/controllers/handle-error";
import {
  deterministicSuggestionProvider,
  type SuggestionProvider,
  validateAiSuggestions,
  validatedFallbackSuggestions,
} from "@/lib/ai";
import { planningRepository } from "@/models/repositories/planning.repository";
import { catalogRepository } from "@/models/repositories/catalog.repository";
import { suggestionInputSchema } from "@/schemas/ai.schema";
import type { ControllerResponse } from "@/types/http";
import type { RecipeSuggestion } from "@/types/suggestion";
import { presentError } from "@/views/error.view";
import { presentSuggestions } from "@/views/suggestion.view";

export async function suggestRecipes(
  input: unknown,
  provider: SuggestionProvider = deterministicSuggestionProvider,
): Promise<ControllerResponse> {
  try {
    const { planningId } = suggestionInputSchema.parse(input);
    const planning = planningRepository.findById(planningId);
    if (!planning) return { status: 404, body: presentError("Planejamento não encontrado") };

    // Client data cannot enlarge this list: every item is rechecked against CF-17.
    const possibleIngredients = planning.shoppingList.items
      .map((item) => item.productName)
      .filter((name) => validateAiSuggestions({
        suggestions: [{ name: "verificação", ingredients: [name], steps: ["verificação"] }],
      }));
    const catalogChecks = await Promise.all(possibleIngredients.map(async (name) => ({
      name,
      authorized: await catalogRepository.isAuthorizedName(name),
    })));
    const availableIngredients = catalogChecks.filter((item) => item.authorized).map((item) => item.name);

    try {
      const suggestions = await provider.suggest(availableIngredients);
      const validated = validateAiSuggestions({ suggestions });
      if (validated) return { status: 200, body: presentSuggestions("deterministic", validated) };
    } catch {
      // The validated fallback below is the controlled response for provider failures.
    }

    return { status: 200, body: presentSuggestions("fallback", fallbackSuggestions()) };
  } catch (error) {
    return handleError(error);
  }
}

function fallbackSuggestions(): RecipeSuggestion[] {
  return validatedFallbackSuggestions();
}
