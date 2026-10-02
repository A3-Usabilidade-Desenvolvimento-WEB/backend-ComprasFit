import { handleError } from "@/controllers/handle-error";
import { priceRepository } from "@/models/repositories/price.repository";
import { productRepository } from "@/models/repositories/product.repository";
import type { ControllerResponse } from "@/types/http";
import { presentProduct } from "@/views/product.view";

// Lista os produtos com o preço mais recente
export function listProducts(): ControllerResponse {
  try {
    const prices = priceRepository.latestByProduct();
    const body = productRepository.list().map((product) => presentProduct(product, prices.get(product.id)));
    return { status: 200, body };
  } catch (error) {
    return handleError(error);
  }
}
