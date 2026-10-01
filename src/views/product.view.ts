import { centsToReais } from "@/lib/money";
import type { Price } from "@/models/price";
import type { Product } from "@/models/product";

// Formata um produto com o preço mais recente
export function presentProduct(product: Product, price?: Price) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    unit: product.unit,
    packageSize: product.packageSize,
    price: price
      ? { value: centsToReais(price.priceCents), store: price.store, updatedAt: price.updatedAt }
      : null,
  };
}
