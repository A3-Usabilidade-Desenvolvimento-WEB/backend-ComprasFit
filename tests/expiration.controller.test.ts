import { beforeEach, describe, expect, it } from "vitest";
import { listExpirations, registerExpiration } from "@/controllers/expiration.controller";
import { resetStore } from "@/models/store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

beforeEach(() => {
  resetStore();
});

describe("validade", () => {
  it("registra por nome ou por produto e lista ordenado", async () => {
    await registerExpiration({ name: "Queijo", expirationDate: "2099-12-31" }, "test-user");
    const second = await registerExpiration({ productId: "leite", expirationDate: "2099-01-15" }, "test-user");
    expect(second.status).toBe(201);
    expect((second.body as Json).name).toBe("Leite integral 1L");

    const list = (await listExpirations("test-user")).body as Json[];
    expect(list.map((i) => i.name)).toEqual(["Leite integral 1L", "Queijo"]);
    expect(list[0].status).toBe("ok");
  });

  it("devolve 404 para produto inexistente e 400 para dados inválidos", async () => {
    expect((await registerExpiration({ productId: "xyz", expirationDate: "2099-01-01" }, "test-user")).status).toBe(404);
    expect((await registerExpiration({ name: "Leite", expirationDate: "ontem" }, "test-user")).status).toBe(400);
  });
});

it("lista apenas as validades do próprio usuário", async () => {
  await registerExpiration({ name: "Arroz", expirationDate: "2099-01-15" }, "owner");
  expect((await listExpirations("other")).body).toEqual([]);
});
