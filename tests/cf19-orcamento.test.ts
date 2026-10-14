import { beforeEach, describe, expect, it } from "vitest";
import { generatePlanning, type Catalog } from "@/lib/planning/generate-planning";
import { createSeedData } from "@/data/seed";
import type { PlanningParams } from "@/models/planning";

// CF-19: toda lista aceita respeita o orçamento na base cadastrada.
// Em vez de testar um cenário só, varre combinações de orçamento, período,
// pessoas, refeições por dia e preferência vegetariana usando o catálogo do seed.

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

const budgets = [50, 100, 150, 200, 250, 300, 400, 600, 1000];
const periods = [1, 3, 7, 14];
const peopleCounts = [1, 2, 4];
const mealsPerDayOptions = [1, 2, 3];
const vegetarianOptions = [false, true];

function allScenarios(): PlanningParams[] {
  const list: PlanningParams[] = [];
  for (const budget of budgets)
    for (const periodDays of periods)
      for (const people of peopleCounts)
        for (const mealsPerDay of mealsPerDayOptions)
          for (const vegetarian of vegetarianOptions)
            list.push({ ...baseParams, budget, periodDays, people, mealsPerDay, vegetarian });
  return list;
}

const label = (p: PlanningParams) =>
  `orçamento=${p.budget} dias=${p.periodDays} pessoas=${p.people} refeições/dia=${p.mealsPerDay} vegetariano=${p.vegetarian}`;

beforeEach(() => {
  const seed = createSeedData();
  recipes = seed.recipes;
  catalog = {
    products: new Map(seed.products.map((p) => [p.id, p])),
    prices: new Map(seed.prices.map((p) => [p.productId, p])),
  };
});

describe("CF-19 · orçamento respeitado em todos os cenários", () => {
  it("só aceita (fitsBudget) quando o total cabe no orçamento, e só recusa quando passa", () => {
    let accepted = 0;
    let rejected = 0;

    for (const params of allScenarios()) {
      const draft = generatePlanning(params, recipes, catalog);
      const total = draft.shoppingList.totalCents;

      if (draft.fitsBudget) {
        accepted++;
        expect(total, `aceito deveria caber: ${label(params)}`).toBeLessThanOrEqual(draft.budgetCents);
      } else {
        rejected++;
        expect(total, `recusado deveria estourar: ${label(params)}`).toBeGreaterThan(draft.budgetCents);
      }
    }

    // garante que a varredura exercitou os dois caminhos
    expect(accepted).toBeGreaterThan(0);
    expect(rejected).toBeGreaterThan(0);
  });

  it("a diferença é sempre orçamento menos total (positiva sobra, negativa estouro)", () => {
    for (const params of allScenarios()) {
      const draft = generatePlanning(params, recipes, catalog);
      expect(draft.differenceCents, label(params)).toBe(draft.budgetCents - draft.shoppingList.totalCents);
    }
  });

  it("o total é a soma de embalagens x preço unitário de cada item, e cada item cobre a necessidade", () => {
    for (const params of allScenarios()) {
      const { shoppingList } = generatePlanning(params, recipes, catalog);
      let sum = 0;
      for (const item of shoppingList.items) {
        expect(item.subtotalCents, label(params)).toBe(item.packages * item.unitPriceCents);
        expect(item.packages * item.packageSize, label(params)).toBeGreaterThanOrEqual(item.quantityNeeded);
        sum += item.subtotalCents;
      }
      expect(shoppingList.totalCents, label(params)).toBe(sum);
    }
  });

  it("o custo da lista não depende do orçamento informado", () => {
    for (const periodDays of periods) {
      for (const people of peopleCounts) {
        const base = { ...baseParams, periodDays, people };
        const low = generatePlanning({ ...base, budget: 100 }, recipes, catalog);
        const high = generatePlanning({ ...base, budget: 1000 }, recipes, catalog);
        expect(low.shoppingList.totalCents, `dias=${periodDays} pessoas=${people}`).toBe(
          high.shoppingList.totalCents,
        );
      }
    }
  });

  it("aumentar o orçamento nunca transforma um planejamento aceito em recusado", () => {
    for (const periodDays of periods) {
      for (const people of peopleCounts) {
        let wasAccepted = false;
        for (const budget of budgets) {
          const draft = generatePlanning({ ...baseParams, periodDays, people, budget }, recipes, catalog);
          if (wasAccepted) {
            expect(draft.fitsBudget, `dias=${periodDays} pessoas=${people} orçamento=${budget}`).toBe(true);
          }
          wasAccepted = wasAccepted || draft.fitsBudget;
        }
      }
    }
  });

  it("limite exato: total igual ao orçamento é aceito, 1 centavo a menos é recusado", () => {
    const total = generatePlanning({ ...baseParams, budget: 1000 }, recipes, catalog).shoppingList.totalCents;

    const exact = generatePlanning({ ...baseParams, budget: total / 100 }, recipes, catalog);
    expect(exact.fitsBudget).toBe(true);
    expect(exact.differenceCents).toBe(0);

    const oneCentShort = generatePlanning({ ...baseParams, budget: (total - 1) / 100 }, recipes, catalog);
    expect(oneCentShort.fitsBudget).toBe(false);
    expect(oneCentShort.differenceCents).toBe(-1);
  });
});
