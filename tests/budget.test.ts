import { describe, expect, it } from "vitest";
import { calculateSubtotal, calculateTotal } from "@/lib/budget/calculate-budget";
import { calculatePackages } from "@/lib/budget/calculate-packages";
import { checkBudget } from "@/lib/budget/validate-budget";

describe("checkBudget", () => {
  it("aceita orçamento de R$ 300 com custo de R$ 285", () => {
    const result = checkBudget(28_500, 30_000);
    expect(result.fits).toBe(true);
    expect(result.differenceCents).toBe(1_500);
  });

  it("rejeita orçamento de R$ 300 com custo de R$ 325", () => {
    const result = checkBudget(32_500, 30_000);
    expect(result.fits).toBe(false);
    expect(result.differenceCents).toBe(-2_500);
  });

  it("aceita quando o custo é exatamente igual ao orçamento", () => {
    expect(checkBudget(30_000, 30_000).fits).toBe(true);
  });
});

describe("calculatePackages", () => {
  it("arredonda para cima as embalagens necessárias", () => {
    expect(calculatePackages(1_200, 1_000)).toEqual({ packages: 2, leftover: 800 });
  });

  it("não sobra nada quando a quantidade é exata", () => {
    expect(calculatePackages(1_000, 500)).toEqual({ packages: 2, leftover: 0 });
  });

  it("devolve zero embalagens para quantidade zero", () => {
    expect(calculatePackages(0, 500)).toEqual({ packages: 0, leftover: 0 });
  });

  it("falha com embalagem de tamanho zero", () => {
    expect(() => calculatePackages(100, 0)).toThrow();
  });
});

describe("subtotal e total", () => {
  it("multiplica embalagens pelo preço", () => {
    expect(calculateSubtotal(3, 849)).toBe(2_547);
  });

  it("soma os subtotais", () => {
    expect(calculateTotal([{ subtotalCents: 1_000 }, { subtotalCents: 550 }])).toBe(1_550);
  });

  it("devolve zero para lista vazia", () => {
    expect(calculateTotal([])).toBe(0);
  });
});
