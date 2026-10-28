import type { RecipeSuggestion } from "@/types/suggestion";

// Formata a resposta de sugestões e informa a origem do provedor.
export function presentSuggestions(source: "deterministic" | "fallback", suggestions: RecipeSuggestion[]) {
  return { source, suggestions };
}
