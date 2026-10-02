import { daysBetween } from "@/lib/date";
import type { FoodExpiration } from "@/models/food-expiration";

export type ExpirationStatus = "expired" | "expiring_soon" | "ok";

// Quantidade de dias para considerar um item "perto de vencer"
export const EXPIRING_SOON_DAYS = 3;

// Calcula quantos dias faltam para o item vencer
export function daysUntilExpiration(item: FoodExpiration, today: string): number {
  return daysBetween(today, item.expirationDate);
}

// Classifica o item como vencido, perto de vencer ou ok
export function getExpirationStatus(item: FoodExpiration, today: string): ExpirationStatus {
  const days = daysUntilExpiration(item, today);
  if (days < 0) return "expired";
  if (days <= EXPIRING_SOON_DAYS) return "expiring_soon";
  return "ok";
}

// Ordena os itens do que vence primeiro para o que vence por último
export function sortByExpiration(items: FoodExpiration[]): FoodExpiration[] {
  return [...items].sort(
    (a, b) => a.expirationDate.localeCompare(b.expirationDate) || a.name.localeCompare(b.name, "pt-BR"),
  );
}
