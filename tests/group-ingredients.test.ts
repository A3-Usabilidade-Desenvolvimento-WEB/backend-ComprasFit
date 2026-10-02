import { describe, expect, it } from "vitest";
import { groupIngredients } from "@/lib/planning/group-ingredients";
import type { Recipe } from "@/models/recipe";

const recipe: Recipe = {
  id: "r1",
  name: "Teste",
  servings: 2,
  vegetarian: true,
  basePreparation: [],
  ingredients: [
    { productId: "arroz", quantity: 100 },
    { productId: "feijao", quantity: 50 },
  ],
};

describe("groupIngredients", () => {
  it("soma o mesmo ingrediente de refeições repetidas", () => {
    const totals = groupIngredients([
      { recipe, people: 2 },
      { recipe, people: 2 },
    ]);
    expect(totals.get("arroz")).toBe(200);
    expect(totals.get("feijao")).toBe(100);
  });

  it("ajusta as quantidades para o número de pessoas", () => {
    const totals = groupIngredients([{ recipe, people: 4 }]);
    expect(totals.get("arroz")).toBe(200);
  });

  it("arredonda para cima quando a proporção não é inteira", () => {
    const totals = groupIngredients([{ recipe, people: 1 }]);
    expect(totals.get("feijao")).toBe(25);
    const odd = groupIngredients([{ recipe: { ...recipe, servings: 3 }, people: 1 }]);
    expect(odd.get("arroz")).toBe(34);
  });
});
