import type { RecipeSuggestion } from "@/types/suggestion";

type CatalogSuggestion = RecipeSuggestion & { recipeId: string; ingredientsInList: number };

export function presentSuggestions(suggestions: CatalogSuggestion[], nextOffset: number | null) {
  return { source: "catalog", suggestions, nextOffset };
}
