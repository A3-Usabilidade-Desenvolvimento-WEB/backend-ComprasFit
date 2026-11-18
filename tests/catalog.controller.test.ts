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
  it("lista os produtos com preço em reais", async () => {
    const res = await listProducts();
    const arroz = (res.body as Json[]).find((p) => p.id === "arroz");
    expect(res.status).toBe(200);
    expect(arroz.price.value).toBe(27.9);
  });

  it("todo produto vem com preço cadastrado", async () => {
    const body = (await listProducts()).body as Json[];
    expect(body.length).toBeGreaterThan(0);
    expect(body.every((p) => p.price !== null)).toBe(true);
  });
});

describe("GET /receitas", () => {
  it("lista as receitas com nome dos ingredientes", async () => {
    const res = await listRecipes();
    expect(res.status).toBe(200);
    expect((res.body as Json[])[0].ingredients[0].name).toBeTruthy();
  });

  it("todo ingrediente das receitas existe no catálogo de produtos", async () => {
    const productIds = new Set(((await listProducts()).body as Json[]).map((p) => p.id));
    for (const recipe of (await listRecipes()).body as Json[]) {
      for (const ingredient of recipe.ingredients) {
        expect(productIds.has(ingredient.productId)).toBe(true);
      }
    }
  });
});

it("classifica pelo papel do ingrediente no prato e preserva as proteínas vegetais", async () => {
  const data = (await listRecipes()).body as ReturnType<typeof import("@/views/recipe.view").presentRecipe>[];
  const lentils = data.find(r => r.id === "lentilha-arroz-cenoura")!;
  expect(lentils.hasProteinMain).toBe(true);
  expect(lentils.ingredients.find(i => i.productId === "lentilha")).toMatchObject({ foodRole: "Proteína vegetal", mainProtein: true });
  expect(lentils.ingredients.find(i => i.productId === "cenoura")).toMatchObject({ foodRole: "Hortaliça", mainProtein: false });
  const porridge = data.find(r => r.id === "mingau-aveia-banana")!;
  expect(porridge.hasProteinMain).toBe(false);
  expect(porridge.preferences.goals).not.toContain("Rico em proteína");
  const potatoes = data.find(r => r.id === "carne-moida-batata-doce")!;
  expect(potatoes.ingredients.find(i => i.productId === "batata-doce")?.foodRole).toBe("Carboidrato");
});
