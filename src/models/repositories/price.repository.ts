import { getStore } from "@/models/store";
import type { Price } from "@/models/price";

export const priceRepository = {
  // Lista todos os preços cadastrados
  list(): Price[] {
    return getStore().prices;
  },

  // Monta um mapa produto -> preço mais recente
  latestByProduct(): Map<string, Price> {
    const latest = new Map<string, Price>();
    for (const price of getStore().prices) {
      const current = latest.get(price.productId);
      if (!current || price.updatedAt > current.updatedAt) {
        latest.set(price.productId, price);
      }
    }
    return latest;
  },
};
