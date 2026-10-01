import { randomUUID } from "node:crypto";
import { getStore } from "@/models/store";
import type { FoodExpiration } from "@/models/food-expiration";

export const expirationRepository = {
  // Salva uma validade nova e devolve com id e data de registro
  save(data: Omit<FoodExpiration, "id" | "registeredAt">): FoodExpiration {
    const item: FoodExpiration = { ...data, id: randomUUID(), registeredAt: new Date().toISOString() };
    getStore().expirations.push(item);
    return item;
  },

  // Lista todas as validades registradas
  list(): FoodExpiration[] {
    return [...getStore().expirations];
  },
};
