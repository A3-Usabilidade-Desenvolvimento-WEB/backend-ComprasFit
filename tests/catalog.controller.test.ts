import { beforeEach, describe, expect, it } from "vitest";
import { listProducts } from "@/controllers/product.controller";
import { listRecipes } from "@/controllers/recipe.controller";
import { resetStore } from "@/models/store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

beforeEach(() => {
  resetStore();
});

describe("GET /produtos", () => {
  it("lista os produtos com preço em reais", () => {
    const res = listProducts();
    const arroz = (res.body as Json[]).find((p) => p.id === "arroz");
    expect(res.status).toBe(200);
    expect(arroz.price.value).toBe(27.9);
  });

  it("todo produto vem com preço cadastrado", () => {
    const body = listProducts().body as Json[];
    expect(body.length).toBeGreaterThan(0);
    expect(body.every((p) => p.price !== null)).toBe(true);
  });
});

describe("GET /receitas", () => {
  it("lista as receitas com nome dos ingredientes", () => {
    const res = listRecipes();
    expect(res.status).toBe(200);
    expect((res.body as Json[])[0].ingredients[0].name).toBeTruthy();
  });

  it("todo ingrediente das receitas existe no catálogo de produtos", () => {
    const productIds = new Set((listProducts().body as Json[]).map((p) => p.id));
    for (const recipe of listRecipes().body as Json[]) {
      for (const ingredient of recipe.ingredients) {
        expect(productIds.has(ingredient.productId)).toBe(true);
      }
    }
  });
});
