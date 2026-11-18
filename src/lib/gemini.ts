const defaultModel = "gemini-3.5-flash-lite";

export async function prioritizeTips(ids: string[], facts: object): Promise<string[] | null> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;

  const model = encodeURIComponent(process.env.GEMINI_MODEL?.trim() || defaultModel);
  const limit = Math.min(ids.length, 2);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      signal: AbortSignal.timeout(3500),
      body: JSON.stringify({
        contents: [{ parts: [{ text: JSON.stringify({
          task: "Priorize as dicas mais úteis para interpretar este cardápio e seu custo. Devolva somente os IDs das dicas escolhidas, na melhor ordem.",
          facts,
          availableTips: ids,
        }) }] }],
        generationConfig: {
          maxOutputTokens: 128,
          thinkingConfig: { thinkingLevel: "MINIMAL" },
          responseMimeType: "application/json",
          responseJsonSchema: {
            type: "object",
            properties: { ids: { type: "array", minItems: limit, maxItems: limit, items: { type: "string", enum: ids } } },
            required: ["ids"],
          },
        },
      }),
    });
    if (!response.ok) return null;
    const result = await response.json();
    const candidate = result.candidates?.[0];
    if (candidate?.finishReason !== "STOP") return null;
    const text = candidate.content?.parts?.find((part: { text?: string; thought?: boolean }) => part.text && !part.thought)?.text;
    const chosen: unknown = JSON.parse(text).ids;
    if (!Array.isArray(chosen) || chosen.length !== limit || new Set(chosen).size !== limit ||
        !chosen.every(id => typeof id === "string" && ids.includes(id))) return null;
    return chosen;
  } catch {
    return null;
  }
}
