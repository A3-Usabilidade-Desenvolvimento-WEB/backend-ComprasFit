import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  requireAuthenticatedUser: vi.fn(async () => ({ ok: true, user: { id: "test-user" } })),
}));
import { POST } from "@/app/api/ia/sugestao/route";
import { createPlanning } from "@/controllers/planning.controller";
import { planningRepository } from "@/models/repositories/planning.repository";
import { resetStore } from "@/models/store";

beforeEach(() => resetStore());

describe("POST /api/ia/sugestao", () => {
  it("responde com sugestão determinística quando o planejamento tem ingredientes autorizados", async () => {
    const created = createPlanning({ budget: 300, periodDays: 7, people: 4 }).body as { id: string };
    const planning = planningRepository.findById(created.id);
    if (!planning) throw new Error("Planejamento deveria existir");
    planning.shoppingList.items = [
      { ...planning.shoppingList.items[0], productName: "Arroz" },
      { ...planning.shoppingList.items[0], id: "feijao-catalogo", productName: "Feijão Carioca Camil 1Kg" },
    ];

    const response = await POST(new Request("http://localhost/api/ia/sugestao", {
      method: "POST",
      body: JSON.stringify({ planningId: created.id }),
      headers: { "content-type": "application/json" },
    }));
    const body = await response.json() as { source: string; suggestions: { ingredients: string[] }[] };
    expect(response.status).toBe(200);
    expect(body.source).toBe("deterministic");
    expect(body.suggestions[0].ingredients).toEqual(["Arroz", "Feijão Carioca Camil 1Kg"]);
  });
});
