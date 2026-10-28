import { allowedProductNames, normalizeProductName } from "@/data/allowed-products";
import { aiResponseSchema } from "@/schemas/ai.schema";
import type { RecipeSuggestion } from "@/types/suggestion";

export interface SuggestionProvider {
  suggest(availableIngredients: readonly string[]): Promise<RecipeSuggestion[]>;
}

interface RecipeTemplate extends RecipeSuggestion {
  requiredIngredients: readonly string[];
}

// Local recipes use exact catalog names, so no API key or network call is needed.
const deterministicRecipes: readonly RecipeTemplate[] = [
  {
    name: "Arroz com feijão",
    ingredients: ["Arroz", "Feijão Carioca Camil 1Kg"],
    requiredIngredients: ["Arroz", "Feijão Carioca Camil 1Kg"],
    steps: ["Prepare os produtos conforme as instruções das embalagens e sirva juntos."],
  },
  {
    name: "Arroz com frango",
    ingredients: ["Arroz", "Filé de Peito de Frango Resfriado 1Kg"],
    requiredIngredients: ["Arroz", "Filé de Peito de Frango Resfriado 1Kg"],
    steps: ["Prepare os produtos conforme as instruções das embalagens e sirva juntos."],
  },
];

export class DeterministicSuggestionProvider implements SuggestionProvider {
  async suggest(availableIngredients: readonly string[]): Promise<RecipeSuggestion[]> {
    const available = new Set(availableIngredients.map(normalizeProductName));
    return deterministicRecipes
      .filter((recipe) => recipe.requiredIngredients.every((ingredient) => available.has(normalizeProductName(ingredient))))
      .map(({ requiredIngredients: _requiredIngredients, ...recipe }) => recipe);
  }
}

export const deterministicSuggestionProvider = new DeterministicSuggestionProvider();

// Safe presentation normalization only; this is never a partial or fuzzy match.
export function validateAiSuggestions(
  raw: unknown,
  allowedNames: ReadonlySet<string> = allowedProductNames,
): RecipeSuggestion[] | null {
  const parsed = aiResponseSchema.safeParse(raw);
  if (!parsed.success) return null;
  const usesOnlyAllowed = parsed.data.suggestions.every((suggestion) =>
    suggestion.ingredients.every((ingredient) => allowedNames.has(normalizeProductName(ingredient))),
  );
  return usesOnlyAllowed ? parsed.data.suggestions : null;
}

export function safeFallbackSuggestions(): RecipeSuggestion[] {
  return deterministicRecipes.map(({ requiredIngredients: _requiredIngredients, ...recipe }) => recipe);
}

export function validatedFallbackSuggestions(candidates: RecipeSuggestion[] = safeFallbackSuggestions()): RecipeSuggestion[] {
  return validateAiSuggestions({ suggestions: candidates }) ?? [];
}
