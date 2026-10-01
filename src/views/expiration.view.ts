import {
  daysUntilExpiration,
  getExpirationStatus,
} from "@/lib/expiration/sort-by-expiration";
import type { FoodExpiration } from "@/models/food-expiration";

// Formata uma validade com dias restantes e situação
export function presentExpiration(item: FoodExpiration, today: string) {
  return {
    id: item.id,
    name: item.name,
    productId: item.productId ?? null,
    expirationDate: item.expirationDate,
    daysLeft: daysUntilExpiration(item, today),
    status: getExpirationStatus(item, today),
    registeredAt: item.registeredAt,
  };
}
