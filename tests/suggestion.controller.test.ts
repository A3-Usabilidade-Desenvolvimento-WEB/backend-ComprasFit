import { beforeEach, describe, expect, it } from "vitest";
import { createPlanning } from "@/controllers/planning.controller";
import { suggestRecipes } from "@/controllers/suggestion.controller";
import { resetStore } from "@/models/store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

beforeEach(() => {
  resetStore();
  delete process.env.LLM_API_KEY;
});

describe("POST /ia/sugestao", () => {
  it("usa as receitas-base quando não há resposta da IA", async () => {
    const created = createPlanning({ budget: 300, periodDays: 7, people: 4 }).body as Json;
    const res = await suggestRecipes({ planningId: created.id });
    const body = res.body as Json;
    expect(res.status).toBe(200);
    expect(body.source).toBe("fallback");
    expect(body.suggestions.length).toBeGreaterThan(0);
    expect(body.suggestions[0].steps.length).toBeGreaterThan(0);
  });

  it("devolve 404 para planejamento inexistente e 400 sem planningId", async () => {
    expect((await suggestRecipes({ planningId: "x" })).status).toBe(404);
    expect((await suggestRecipes({})).status).toBe(400);
  });
});
