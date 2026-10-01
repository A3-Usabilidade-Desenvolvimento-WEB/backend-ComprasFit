import { describe, expect, it } from "vitest";
import { expirationInputSchema } from "@/schemas/expiration.schema";

describe("expirationInputSchema", () => {
  it("aceita nome ou productId com data válida", () => {
    expect(expirationInputSchema.safeParse({ name: "Leite", expirationDate: "2026-10-10" }).success).toBe(true);
    expect(expirationInputSchema.safeParse({ productId: "leite", expirationDate: "2026-10-10" }).success).toBe(true);
  });

  it("rejeita sem nome e sem productId", () => {
    expect(expirationInputSchema.safeParse({ expirationDate: "2026-10-10" }).success).toBe(false);
  });

  it("rejeita data inválida", () => {
    expect(expirationInputSchema.safeParse({ name: "Leite", expirationDate: "2026-13-40" }).success).toBe(false);
  });
});
