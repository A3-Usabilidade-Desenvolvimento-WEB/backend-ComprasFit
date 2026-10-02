import { beforeEach, describe, expect, it } from "vitest";
import { generatePlanning, scheduleMeals, type Catalog } from "@/lib/planning/generate-planning";
import { suggestAdjustments } from "@/lib/planning/suggest-adjustments";
import { createSeedData } from "@/data/seed";
import type { PlanningParams } from "@/models/planning";

let recipes: ReturnType<typeof createSeedData>["recipes"];
let catalog: Catalog;

const baseParams: PlanningParams = {
  budget: 300,
  periodDays: 7,
  people: 4,
  mealsPerDay: 2,
  buyingPreference: "lowest_price",
  vegetarian: false,
};

beforeEach(() => {
  const seed = createSeedData();
  recipes = seed.recipes;
  catalog = {
    products: new Map(seed.products.map((p) => [p.id, p])),
    prices: new Map(seed.prices.map((p) => [p.productId, p])),
  };
});

describe("generatePlanning", () => {
  it("gera uma refeição para cada dia x refeições por dia", () => {
    const draft = generatePlanning(baseParams, recipes, catalog);
    expect(draft.meals).toHaveLength(14);
    expect(draft.meals[0]).toMatchObject({ day: 1, slot: 1 });
    expect(draft.meals[13]).toMatchObject({ day: 7, slot: 2 });
  });

  it("o total é a soma dos subtotais da lista", () => {
    const { shoppingList } = generatePlanning(baseParams, recipes, catalog);
    const sum = shoppingList.items.reduce((acc, item) => acc + item.subtotalCents, 0);
    expect(shoppingList.totalCents).toBe(sum);
  });

  it("cada item cobre a quantidade necessária com embalagens inteiras", () => {
    const { shoppingList } = generatePlanning(baseParams, recipes, catalog);
    for (const item of shoppingList.items) {
      expect(item.packages * item.packageSize).toBeGreaterThanOrEqual(item.quantityNeeded);
      expect(item.subtotalCents).toBe(item.packages * item.unitPriceCents);
    }
  });

  it("aceita o planejamento quando o total cabe no orçamento", () => {
    const draft = generatePlanning(baseParams, recipes, catalog);
    expect(draft.shoppingList.totalCents).toBeLessThanOrEqual(draft.budgetCents);
    expect(draft.fitsBudget).toBe(true);
    expect(draft.differenceCents).toBeGreaterThanOrEqual(0);
  });

  it("rejeita o planejamento quando o total passa do orçamento", () => {
    const draft = generatePlanning({ ...baseParams, budget: 100 }, recipes, catalog);
    expect(draft.fitsBudget).toBe(false);
    expect(draft.differenceCents).toBeLessThan(0);
  });

  it("usa apenas receitas vegetarianas quando pedido", () => {
    const draft = generatePlanning({ ...baseParams, vegetarian: true }, recipes, catalog);
    const vegetarianIds = recipes.filter((r) => r.vegetarian).map((r) => r.id);
    for (const meal of draft.meals) {
      expect(vegetarianIds).toContain(meal.recipeId);
    }
  });

  it("restringe às receitas escolhidas", () => {
    const draft = generatePlanning({ ...baseParams, recipeIds: ["mingau-aveia-banana"] }, recipes, catalog);
    expect(new Set(draft.meals.map((m) => m.recipeId))).toEqual(new Set(["mingau-aveia-banana"]));
  });

  it("falha com receita inexistente", () => {
    expect(() => generatePlanning({ ...baseParams, recipeIds: ["nao-existe"] }, recipes, catalog)).toThrow(
      /não encontradas/,
    );
  });

  it("falha quando nenhuma receita atende às preferências", () => {
    const onlyMeat = recipes.filter((r) => !r.vegetarian);
    expect(() => generatePlanning({ ...baseParams, vegetarian: true }, onlyMeat, catalog)).toThrow(
      /Nenhuma receita/,
    );
  });

  it("falha quando falta preço de um produto usado", () => {
    catalog.prices.delete("arroz");
    expect(() => generatePlanning(baseParams, recipes, catalog)).toThrow(/Sem preço/);
  });

  it("com menor preço, começa pela receita mais barata por porção", () => {
    const cheap = generatePlanning({ ...baseParams, periodDays: 1, mealsPerDay: 1 }, recipes, catalog);
    expect(cheap.meals[0].recipeId).toBe("macarrao-molho-tomate");
  });
});

describe("scheduleMeals", () => {
  it("repete as receitas em rodízio", () => {
    const two = recipes.slice(0, 2);
    const meals = scheduleMeals({ ...baseParams, periodDays: 2, mealsPerDay: 2 }, two);
    expect(meals.map((m) => m.recipe.id)).toEqual([two[0].id, two[1].id, two[0].id, two[1].id]);
  });
});

describe("suggestAdjustments", () => {
  it("informa o valor estourado e sugere ajustes", () => {
    const draft = generatePlanning({ ...baseParams, budget: 250 }, recipes, catalog);
    const adjustments = suggestAdjustments(draft);
    expect(adjustments.excessCents).toBe(-draft.differenceCents);
    expect(adjustments.topItems).toHaveLength(3);
    expect(adjustments.topItems[0].subtotalCents).toBeGreaterThanOrEqual(adjustments.topItems[1].subtotalCents);
    expect(adjustments.suggestions.length).toBeGreaterThanOrEqual(2);
  });
});
