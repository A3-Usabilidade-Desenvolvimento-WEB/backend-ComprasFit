import type { RecipeSuggestion } from "@/types/suggestion";

// Formata a resposta de sugestões e informa a origem (IA ou receita-base)
export function presentSuggestions(source: "ai" | "fallback", suggestions: RecipeSuggestion[]) {
  return { source, suggestions };
}
