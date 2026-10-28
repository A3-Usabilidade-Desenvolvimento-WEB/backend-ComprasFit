import { beforeEach, describe, expect, it } from "vitest";
import { createPlanning } from "@/controllers/planning.controller";
import { suggestRecipes } from "@/controllers/suggestion.controller";
import { isAllowedProductName } from "@/data/allowed-products";
import { resetStore } from "@/models/store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

beforeEach(() => resetStore());

describe("POST /ia/sugestao", () => {
  it("funciona sem LLM_API_KEY e usa fallback seguro quando o planejamento não contém ingredientes suficientes", async () => {
    delete process.env.LLM_API_KEY;
    const created = createPlanning({ budget: 300, periodDays: 7, people: 4 }).body as Json;
    const response = await suggestRecipes({ planningId: created.id });
    const body = response.body as Json;
    expect(response.status).toBe(200);
    expect(body.source).toBe("fallback");
    expect(body.suggestions).not.toHaveLength(0);
  });

  it("devolve 404 para planejamento inexistente e 400 sem planningId", async () => {
    expect((await suggestRecipes({ planningId: "x" })).status).toBe(404);
    expect((await suggestRecipes({})).status).toBe(400);
  });

  it("rejeita resposta inválida de provedor injetado sem vazar ingrediente proibido", async () => {
    const created = createPlanning({ budget: 300, periodDays: 7, people: 4 }).body as Json;
    const body = (await suggestRecipes({ planningId: created.id }, {
      suggest: async () => [{ name: "Inválida", ingredients: ["ProdutoQueNaoExiste"], steps: ["Cozinhe."] }],
    })).body as Json;
    expect(body.source).toBe("fallback");
    expect(JSON.stringify(body)).not.toContain("ProdutoQueNaoExiste");
  });

  it("usa fallback quando o provedor falha", async () => {
    const created = createPlanning({ budget: 300, periodDays: 7, people: 4 }).body as Json;
    const body = (await suggestRecipes({ planningId: created.id }, {
      suggest: async () => { throw new Error("falha controlada"); },
    })).body as Json;
    expect(body.source).toBe("fallback");
  });

  it("valida todos os ingredientes retornados pelo fallback", async () => {
    const created = createPlanning({ budget: 300, periodDays: 7, people: 4 }).body as Json;
    const body = (await suggestRecipes({ planningId: created.id })).body as Json;
    expect(body.suggestions.flatMap((suggestion: Json) => suggestion.ingredients).every(isAllowedProductName)).toBe(true);
  });
});
