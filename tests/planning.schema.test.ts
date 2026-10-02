import { describe, expect, it } from "vitest";
import { planningInputSchema, purchaseInputSchema } from "@/schemas/planning.schema";

const valid = { budget: 300, periodDays: 7, people: 2 };

describe("planningInputSchema", () => {
  it("aceita entrada válida e aplica os padrões", () => {
    const result = planningInputSchema.parse(valid);
    expect(result).toMatchObject({ mealsPerDay: 2, buyingPreference: "lowest_price", vegetarian: false });
  });

  it("rejeita orçamento negativo", () => {
    expect(planningInputSchema.safeParse({ ...valid, budget: -10 }).success).toBe(false);
  });

  it("rejeita orçamento zero", () => {
    expect(planningInputSchema.safeParse({ ...valid, budget: 0 }).success).toBe(false);
  });

  it("rejeita zero pessoas", () => {
    expect(planningInputSchema.safeParse({ ...valid, people: 0 }).success).toBe(false);
  });

  it("rejeita período inválido", () => {
    expect(planningInputSchema.safeParse({ ...valid, periodDays: 0 }).success).toBe(false);
    expect(planningInputSchema.safeParse({ ...valid, periodDays: 45 }).success).toBe(false);
    expect(planningInputSchema.safeParse({ ...valid, periodDays: 2.5 }).success).toBe(false);
  });

  it("rejeita valores em texto e corpo vazio", () => {
    expect(planningInputSchema.safeParse({ ...valid, budget: "300" }).success).toBe(false);
    expect(planningInputSchema.safeParse(undefined).success).toBe(false);
  });
});

describe("purchaseInputSchema", () => {
  it("aceita boolean e rejeita outros tipos", () => {
    expect(purchaseInputSchema.safeParse({ purchased: true }).success).toBe(true);
    expect(purchaseInputSchema.safeParse({ purchased: "sim" }).success).toBe(false);
  });
});
