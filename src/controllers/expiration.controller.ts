import { handleError } from "@/controllers/handle-error";
import { todayISO } from "@/lib/date";
import { sortByExpiration } from "@/lib/expiration/sort-by-expiration";
import { expirationRepository } from "@/models/repositories/expiration.repository";
import { productRepository } from "@/models/repositories/product.repository";
import { expirationInputSchema } from "@/schemas/expiration.schema";
import type { ControllerResponse } from "@/types/http";
import { presentError } from "@/views/error.view";
import { presentExpiration } from "@/views/expiration.view";

// Registra a validade de um alimento
export function registerExpiration(input: unknown): ControllerResponse {
  try {
    const data = expirationInputSchema.parse(input);

    let name = data.name;
    if (data.productId) {
      const product = productRepository.findById(data.productId);
      if (!product) return { status: 404, body: presentError("Produto não encontrado") };
      name = name ?? product.name;
    }

    const item = expirationRepository.save({
      name: name as string,
      productId: data.productId,
      expirationDate: data.expirationDate,
    });
    return { status: 201, body: presentExpiration(item, todayISO()) };
  } catch (error) {
    return handleError(error);
  }
}

// Lista os alimentos ordenados do que vence primeiro para o último
export function listExpirations(): ControllerResponse {
  try {
    const today = todayISO();
    const body = sortByExpiration(expirationRepository.list()).map((item) => presentExpiration(item, today));
    return { status: 200, body };
  } catch (error) {
    return handleError(error);
  }
}
