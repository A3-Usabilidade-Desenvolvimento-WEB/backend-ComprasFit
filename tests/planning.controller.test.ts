import { beforeEach, describe, expect, it } from "vitest";
import {
  createPlanning,
  getPlanning,
  listPlannings,
  setItemPurchased,
} from "@/controllers/planning.controller";
import { resetStore } from "@/models/store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

const valid = { budget: 300, periodDays: 7, people: 4 };

beforeEach(() => {
  resetStore();
});

describe("POST /planejamento", () => {
  it("cria e salva quando cabe no orçamento (R$ 300)", async () => {
    const res = await createPlanning(valid, "test-user");
    const body = res.body as Json;
    expect(res.status).toBe(201);
    expect(body.fitsBudget).toBe(true);
    expect(body.total).toBeLessThanOrEqual(300);
    expect(body.id).toBeTruthy();
    expect((await listPlannings("test-user")).body as Json[]).toHaveLength(1);
  });

  it("devolve 422 com explicação e não salva quando não cabe", async () => {
    const res = await createPlanning({ ...valid, budget: 250 }, "test-user");
    const body = res.body as Json;
    expect(res.status).toBe(422);
    expect(body.excess).toBeGreaterThan(0);
    expect(body.suggestions.length).toBeGreaterThan(0);
    expect(body.preview.fitsBudget).toBe(false);
    expect((await listPlannings("test-user")).body as Json[]).toHaveLength(0);
  });

  it("devolve 400 para orçamento negativo, zero pessoas e período inválido", async () => {
    for (const bad of [{ ...valid, budget: -1 }, { ...valid, people: 0 }, { ...valid, periodDays: 0 }]) {
      const res = await createPlanning(bad, "test-user");
      expect(res.status).toBe(400);
      expect((res.body as Json).details.length).toBeGreaterThan(0);
    }
  });

  it("devolve 400 para corpo ausente", async () => {
    expect((await createPlanning(undefined, "test-user")).status).toBe(400);
  });

  it("devolve 422 quando a receita escolhida não existe", async () => {
    const res = await createPlanning({ ...valid, recipeIds: ["nao-existe"] }, "test-user");
    expect(res.status).toBe(422);
  });
});

describe("GET /planejamento/:id e itens", () => {
  it("busca por id e devolve 404 se não existir", async () => {
    const created = (await createPlanning(valid, "test-user")).body as Json;
    expect((await getPlanning(created.id, "test-user")).status).toBe(200);
    expect((await getPlanning("nao-existe", "test-user")).status).toBe(404);
  });

  it("marca e desmarca um item como comprado", async () => {
    const created = (await createPlanning(valid, "test-user")).body as Json;
    const itemId = created.shoppingList.items[0].id;

    const marked = await setItemPurchased(created.id, itemId, { purchased: true }, "test-user");
    expect(marked.status).toBe(200);
    expect((marked.body as Json).purchased).toBe(true);

    const saved = (await getPlanning(created.id, "test-user")).body as Json;
    expect(saved.shoppingList.items[0].purchased).toBe(true);

    const unmarked = await setItemPurchased(created.id, itemId, { purchased: false }, "test-user");
    expect((unmarked.body as Json).purchased).toBe(false);
  });

  it("devolve 404 para item ou planejamento inexistente e 400 para corpo inválido", async () => {
    const created = (await createPlanning(valid, "test-user")).body as Json;
    expect((await setItemPurchased(created.id, "item-999", { purchased: true }, "test-user")).status).toBe(404);
    expect((await setItemPurchased("x", "item-1", { purchased: true }, "test-user")).status).toBe(404);
    expect((await setItemPurchased(created.id, "item-1", { purchased: "sim" }, "test-user")).status).toBe(400);
  });
});

it("isola o histórico, a leitura e a compra pelo proprietário", async () => {
  const { body } = await createPlanning(valid, "owner");
  const { id, shoppingList } = body as Json;
  expect((await listPlannings("other")).body).toEqual([]);
  expect((await getPlanning(id, "other")).status).toBe(404);
  expect((await setItemPurchased(id, shoppingList.items[0].id, { purchased: true }, "other")).status).toBe(404);
});
it("preserva a ordem e as repetições na troca de refeição", async () => {
  const mealRecipeIds = ["macarrao-molho-tomate","lentilha-arroz-cenoura","macarrao-molho-tomate"];
  const { body, status } = await createPlanning({ ...valid, periodDays: 3, mealsPerDay: 1, mealRecipeIds }, "owner");
  expect(status).toBe(201);
  expect((body as Json).meals.map((m: Json) => m.recipeId)).toEqual(mealRecipeIds);
});
