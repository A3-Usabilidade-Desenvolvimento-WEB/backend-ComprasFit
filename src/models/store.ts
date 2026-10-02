import { createSeedData } from "@/data/seed";
import type { Price } from "@/models/price";
import type { Product } from "@/models/product";
import type { Recipe } from "@/models/recipe";

export interface Store {
  products: Product[];
  prices: Price[];
  recipes: Recipe[];
}

// Guarda o armazenamento no globalThis para sobreviver ao hot reload do Next.js
const globalForStore = globalThis as unknown as { __comprasfitStore?: Store };

function createStore(): Store {
  return { ...createSeedData() };
}

// Devolve o armazenamento em memória (cria na primeira chamada)
export function getStore(): Store {
  if (!globalForStore.__comprasfitStore) {
    globalForStore.__comprasfitStore = createStore();
  }
  return globalForStore.__comprasfitStore;
}

// Recarrega os dados iniciais e apaga o que foi salvo
export function resetStore(): void {
  globalForStore.__comprasfitStore = createStore();
}
