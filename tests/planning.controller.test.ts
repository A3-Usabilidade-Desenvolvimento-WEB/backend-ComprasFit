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
  it("cria e salva quando cabe no orçamento (R$ 300)", () => {
    const res = createPlanning(valid);
    const body = res.body as Json;
    expect(res.status).toBe(201);
    expect(body.fitsBudget).toBe(true);
    expect(body.total).toBeLessThanOrEqual(300);
    expect(body.id).toBeTruthy();
    expect(listPlannings().body as Json[]).toHaveLength(1);
  });

  it("devolve 422 com explicação e não salva quando não cabe", () => {
    const res = createPlanning({ ...valid, budget: 250 });
    const body = res.body as Json;
    expect(res.status).toBe(422);
    expect(body.excess).toBeGreaterThan(0);
    expect(body.suggestions.length).toBeGreaterThan(0);
    expect(body.preview.fitsBudget).toBe(false);
    expect(listPlannings().body as Json[]).toHaveLength(0);
  });

  it("devolve 400 para orçamento negativo, zero pessoas e período inválido", () => {
    for (const bad of [{ ...valid, budget: -1 }, { ...valid, people: 0 }, { ...valid, periodDays: 0 }]) {
      const res = createPlanning(bad);
      expect(res.status).toBe(400);
      expect((res.body as Json).details.length).toBeGreaterThan(0);
    }
  });

  it("devolve 400 para corpo ausente", () => {
    expect(createPlanning(undefined).status).toBe(400);
  });

  it("devolve 422 quando a receita escolhida não existe", () => {
    const res = createPlanning({ ...valid, recipeIds: ["nao-existe"] });
    expect(res.status).toBe(422);
  });
});

describe("GET /planejamento/:id e itens", () => {
  it("busca por id e devolve 404 se não existir", () => {
    const created = createPlanning(valid).body as Json;
    expect(getPlanning(created.id).status).toBe(200);
    expect(getPlanning("nao-existe").status).toBe(404);
  });

  it("marca e desmarca um item como comprado", () => {
    const created = createPlanning(valid).body as Json;
    const itemId = created.shoppingList.items[0].id;

    const marked = setItemPurchased(created.id, itemId, { purchased: true });
    expect(marked.status).toBe(200);
    expect((marked.body as Json).purchased).toBe(true);

    const saved = getPlanning(created.id).body as Json;
    expect(saved.shoppingList.items[0].purchased).toBe(true);

    const unmarked = setItemPurchased(created.id, itemId, { purchased: false });
    expect((unmarked.body as Json).purchased).toBe(false);
  });

  it("devolve 404 para item ou planejamento inexistente e 400 para corpo inválido", () => {
    const created = createPlanning(valid).body as Json;
    expect(setItemPurchased(created.id, "item-999", { purchased: true }).status).toBe(404);
    expect(setItemPurchased("x", "item-1", { purchased: true }).status).toBe(404);
    expect(setItemPurchased(created.id, "item-1", { purchased: "sim" }).status).toBe(400);
  });
});
