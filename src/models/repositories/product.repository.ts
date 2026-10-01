import { getStore } from "@/models/store";
import type { Product } from "@/models/product";

export const productRepository = {
  // Lista todos os produtos
  list(): Product[] {
    return getStore().products;
  },

  // Busca um produto pelo id
  findById(id: string): Product | undefined {
    return getStore().products.find((product) => product.id === id);
  },
};
