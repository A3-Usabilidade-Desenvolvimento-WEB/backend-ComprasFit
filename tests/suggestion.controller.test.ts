import { beforeEach, describe, expect, it } from "vitest";
import { createPlanning } from "@/controllers/planning.controller";
import { suggestRecipes } from "@/controllers/suggestion.controller";
import { getStore, resetStore } from "@/models/store";
import type { Planning } from "@/models/planning";
import type { presentSuggestions } from "@/views/suggestion.view";

const owner = "test-user";
const planInput = { budget: 300, periodDays: 1, mealsPerDay: 1, people: 2 };

beforeEach(() => resetStore());

describe("catalog suggestions", () => {
  it("pages through real recipes without repeating planned or previously suggested recipes", async () => {
    const plan = (await createPlanning(planInput, owner)).body as Planning;
    const first = await suggestRecipes({ planningId: plan.id }, owner);
    expect(first.status).toBe(200);
    const page = first.body as ReturnType<typeof presentSuggestions>;
    expect(page.source).toBe("catalog");
    expect(page.nextOffset).toBe(3);
    const second = (await suggestRecipes({ planningId: plan.id, offset: page.nextOffset }, owner)).body as ReturnType<typeof presentSuggestions>;
    expect(second.nextOffset).toBeNull();
    expect(second.suggestions).toHaveLength(3);

    const inList = new Set(plan.shoppingList.items.map(item => item.productId));
    const products = new Set(getStore().products.map(product => product.name));
    const suggestions = [...page.suggestions, ...second.suggestions];
    expect(new Set(suggestions.map(item => item.recipeId)).size).toBe(6);
    expect(suggestions.map(item => item.recipeId)).not.toContain(plan.meals[0].recipeId);
    for (const item of suggestions) {
      const recipe = getStore().recipes.find(candidate => candidate.id === item.recipeId)!;
      expect(item.steps).toEqual(recipe.basePreparation);
      expect(item.ingredients.every(name => products.has(name))).toBe(true);
      expect(item.ingredientsInList).toBe(recipe.ingredients.filter(ingredient => inList.has(ingredient.productId)).length);
    }
    const scores = suggestions.map(item => item.ingredientsInList / item.ingredients.length);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("honors compatible recipes and vegetarian plans, including an empty allowed list", async () => {
    const plan = (await createPlanning({ ...planInput, vegetarian: true, recipeIds: ["macarrao-molho-tomate"] }, owner)).body as Planning;
    const filter = { planningId: plan.id, eligibleRecipeIds: ["arroz-feijao-frango", "lentilha-arroz-cenoura"] };
    const result = (await suggestRecipes(filter, owner)).body as ReturnType<typeof presentSuggestions>;
    expect(result.suggestions.map(item => item.recipeId)).toEqual(["lentilha-arroz-cenoura"]);
    expect(result.nextOffset).toBeNull();
    expect((await suggestRecipes({ ...filter, eligibleRecipeIds: [] }, owner)).body).toEqual({
      source: "catalog", suggestions: [], nextOffset: null,
    });
  });

  it("rejects invalid paging and forbids reading another user's plan", async () => {
    const plan = (await createPlanning(planInput, owner)).body as Planning;
    expect((await suggestRecipes({ planningId: plan.id }, "another-user")).status).toBe(404);
    expect((await suggestRecipes({ planningId: plan.id, offset: -1 }, owner)).status).toBe(400);
    expect((await suggestRecipes({}, owner)).status).toBe(400);
  });
});
