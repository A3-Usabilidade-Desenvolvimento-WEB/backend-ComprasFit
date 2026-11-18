import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  requireAuthenticatedUser: vi.fn(async () => ({ ok: true, user: { id: "test-user" } })),
}));
import { POST } from "@/app/api/ia/sugestao/route";
import { createPlanning } from "@/controllers/planning.controller";
import { resetStore } from "@/models/store";
import type { presentSuggestions } from "@/views/suggestion.view";

beforeEach(() => resetStore());

describe("POST /api/ia/sugestao", () => {
  it("returns real recipe IDs, preparation and pagination metadata", async () => {
    const created = (await createPlanning({ budget: 300, periodDays: 1, mealsPerDay: 1, people: 2 }, "test-user")).body as { id: string };
    const response = await POST(new Request("http://localhost/api/ia/sugestao", {
      method: "POST",
      body: JSON.stringify({ planningId: created.id }),
      headers: { "content-type": "application/json" },
    }));
    const body = await response.json() as ReturnType<typeof presentSuggestions>;
    expect(response.status).toBe(200);
    expect(body.source).toBe("catalog");
    expect(body.nextOffset).toBe(3);
    expect(body.suggestions.every(recipe => recipe.recipeId && recipe.steps.length > 0)).toBe(true);
  });
});
