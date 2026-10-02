import { aiResponseSchema } from "@/schemas/ai.schema";
import type { RecipeSuggestion } from "@/types/suggestion";

const LLM_URL = "https://api.anthropic.com/v1/messages";
const TIMEOUT_MS = 15_000;

// Normaliza o texto para comparar ingredientes (minúsculas, sem acento)
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Monta o prompt com a lista de ingredientes aprovados
export function buildPrompt(allowedIngredients: string[]): string {
  return [
    "Sugira até 3 receitas simples usando SOMENTE os ingredientes da lista abaixo.",
    "Não use nenhum ingrediente fora da lista e não fale de preços.",
    `Ingredientes: ${allowedIngredients.join("; ")}`,
    'Responda apenas com JSON no formato: {"suggestions":[{"name":"...","ingredients":["..."],"steps":["..."]}]}',
  ].join("\n");
}

// Remove cercas de markdown (```json) e converte o texto em JSON
export function extractJson(text: string): unknown {
  const clean = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    return undefined;
  }
}

// Valida a resposta da IA: formato correto e só ingredientes aprovados (null se inválida)
export function validateAiSuggestions(raw: unknown, allowedIngredients: string[]): RecipeSuggestion[] | null {
  const parsed = aiResponseSchema.safeParse(raw);
  if (!parsed.success) return null;

  const allowed = allowedIngredients.map(normalize);
  const usesOnlyAllowed = parsed.data.suggestions.every((suggestion) =>
    suggestion.ingredients.every((ingredient) => {
      const name = normalize(ingredient);
      return allowed.some((item) => item.includes(name) || name.includes(item));
    }),
  );

  return usesOnlyAllowed ? parsed.data.suggestions : null;
}

// Chama a API de LLM e devolve as sugestões validadas (null se sem chave, erro ou resposta inválida)
export async function requestAiSuggestions(allowedIngredients: string[]): Promise<RecipeSuggestion[] | null> {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(LLM_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL ?? "claude-sonnet-5-5",
        max_tokens: 1000,
        messages: [{ role: "user", content: buildPrompt(allowedIngredients) }],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((block) => block.type === "text")?.text ?? "";
    return validateAiSuggestions(extractJson(text), allowedIngredients);
  } catch {
    return null;
  }
}
