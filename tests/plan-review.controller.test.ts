import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createPlanning } from "@/controllers/planning.controller";
import { reviewPlan } from "@/controllers/plan-review.controller";
import { resetStore } from "@/models/store";

beforeEach(resetStore);
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it("só permite revisar o próprio plano e limita Gemini às dicas calculadas", async () => {
  vi.stubEnv("GEMINI_API_KEY", "test");
  const fetchGemini = vi.fn(async () => Response.json({ candidates: [{
    finishReason: "STOP",
    content: { parts: [{ text: JSON.stringify({ ids: ["comparar_precos_com_o_mercado", "cobrir_almoco_e_jantar"] }) }] },
  }] }));
  vi.stubGlobal("fetch", fetchGemini);
  const saved = await createPlanning({ budget: 750, people: 1, periodDays: 2, mealsPerDay: 1 }, "owner");
  const { id } = saved.body as { id: string };
  expect((await reviewPlan({ planningId: id }, "other")).status).toBe(404);
  expect(fetchGemini).not.toHaveBeenCalled();
  expect((await reviewPlan({ planningId: id }, "owner")).body).toMatchObject({
    source: "gemini", tips: [expect.stringContaining("referências acadêmicas"), expect.stringContaining("almoço e jantar")],
  });
  expect(fetchGemini).toHaveBeenCalledOnce();
  fetchGemini.mockResolvedValueOnce(Response.json({ candidates: [{
    finishReason: "STOP", content: { parts: [{ text: '{"ids":["preço inventado","qualquer coisa"]}' }] },
  }] }));
  expect((await reviewPlan({ planningId: id }, "owner")).body).toMatchObject({
    source: "rules", tips: [expect.stringContaining("almoço e jantar"), expect.stringContaining("referências acadêmicas")],
  });
});

it("explica a lista salva e simula só receitas compatíveis sem alterar o cardápio", async () => {
  vi.stubEnv("GEMINI_API_KEY", "");
  const recipeId = "lentilha-arroz-cenoura";
  const input = { budget: 750, people: 2, periodDays: 2, mealsPerDay: 1, mealKind: "main", vegan: true,
    recipeIds: [recipeId], dayLabels: ["Segunda-feira", "Terça-feira"] };
  const saved = await createPlanning(input, "owner");
  expect(saved.status).toBe(201);
  const { id } = saved.body as { id: string };
  const result = await reviewPlan({ planningId: id, eligibleRecipeIds: ["macarrao-molho-tomate", "omelete-arroz-legumes"] }, "owner");
  expect(result.body).toMatchObject({ source: "rules", sections: expect.arrayContaining([
    { title: "Cobertura e custo médio", detail: expect.stringContaining("4 porções") },
    { title: "Variedade do cardápio", detail: expect.stringContaining("(2 vezes)") },
    { title: "Troca simulada", detail: expect.stringMatching(/Segunda-feira.*Macarrão ao molho de tomate/) },
  ]) });
  expect((await reviewPlan({ planningId: id, eligibleRecipeIds: ["omelete-arroz-legumes"] }, "owner")).body)
    .not.toMatchObject({ sections: expect.arrayContaining([expect.objectContaining({ title: "Troca simulada" })]) });
});
