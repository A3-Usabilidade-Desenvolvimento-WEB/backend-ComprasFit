import { catalogRepository } from "@/models/repositories/catalog.repository";
import { handleError } from "@/controllers/handle-error";
import type { ControllerResponse } from "@/types/http";
import { presentProduct } from "@/views/product.view";

// Lista os produtos com o preço mais recente
export async function listProducts(): Promise<ControllerResponse> {
  try {
    const data = await catalogRepository.load();
    const prices = new Map(data.prices.map(price => [price.productId, price]));
    const body = data.products.map((product) => presentProduct(product, prices.get(product.id)));
    return { status: 200, body };
  } catch (error) {
    return handleError(error);
  }
}
