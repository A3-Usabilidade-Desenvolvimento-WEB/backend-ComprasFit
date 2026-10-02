import { beforeEach, describe, expect, it } from "vitest";
import { listExpirations, registerExpiration } from "@/controllers/expiration.controller";
import { resetStore } from "@/models/store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

beforeEach(() => {
  resetStore();
});

describe("validade", () => {
  it("registra por nome ou por produto e lista ordenado", () => {
    registerExpiration({ name: "Queijo", expirationDate: "2099-12-31" });
    const second = registerExpiration({ productId: "leite", expirationDate: "2099-01-15" });
    expect(second.status).toBe(201);
    expect((second.body as Json).name).toBe("Leite integral 1L");

    const list = listExpirations().body as Json[];
    expect(list.map((i) => i.name)).toEqual(["Leite integral 1L", "Queijo"]);
    expect(list[0].status).toBe("ok");
  });

  it("devolve 404 para produto inexistente e 400 para dados inválidos", () => {
    expect(registerExpiration({ productId: "xyz", expirationDate: "2099-01-01" }).status).toBe(404);
    expect(registerExpiration({ name: "Leite", expirationDate: "ontem" }).status).toBe(400);
  });
});
