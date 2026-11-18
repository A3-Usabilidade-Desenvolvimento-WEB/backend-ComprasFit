import { allowedProductNames, normalizeProductName } from "@/data/allowed-products";
import { aiResponseSchema } from "@/schemas/ai.schema";
import type { RecipeSuggestion } from "@/types/suggestion";

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
