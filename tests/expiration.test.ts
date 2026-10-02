import { describe, expect, it } from "vitest";
import { getExpirationStatus, sortByExpiration } from "@/lib/expiration/sort-by-expiration";
import type { FoodExpiration } from "@/models/food-expiration";

const make = (name: string, expirationDate: string): FoodExpiration => ({
  id: name,
  name,
  expirationDate,
  registeredAt: "2026-09-30T00:00:00.000Z",
});

describe("sortByExpiration", () => {
  it("ordena do que vence primeiro para o que vence por último", () => {
    const sorted = sortByExpiration([
      make("leite", "2026-10-10"),
      make("ovos", "2026-10-02"),
      make("frango", "2026-10-05"),
    ]);
    expect(sorted.map((item) => item.name)).toEqual(["ovos", "frango", "leite"]);
  });

  it("não altera a lista original", () => {
    const original = [make("b", "2026-10-10"), make("a", "2026-10-01")];
    sortByExpiration(original);
    expect(original[0].name).toBe("b");
  });
});

describe("getExpirationStatus", () => {
  const today = "2026-09-30";

  it("marca como vencido", () => {
    expect(getExpirationStatus(make("a", "2026-09-29"), today)).toBe("expired");
  });

  it("marca como perto de vencer (hoje até 3 dias)", () => {
    expect(getExpirationStatus(make("a", "2026-09-30"), today)).toBe("expiring_soon");
    expect(getExpirationStatus(make("a", "2026-10-03"), today)).toBe("expiring_soon");
  });

  it("marca como ok depois de 3 dias", () => {
    expect(getExpirationStatus(make("a", "2026-10-04"), today)).toBe("ok");
  });
});
