import { catalogRepository } from "@/models/repositories/catalog.repository";
import { handleError } from "@/controllers/handle-error";
import { todayISO } from "@/lib/date";
import { sortByExpiration } from "@/lib/expiration/sort-by-expiration";
import { expirationRepository } from "@/models/repositories/expiration.repository";
import { expirationInputSchema } from "@/schemas/expiration.schema";
import type { ControllerResponse } from "@/types/http";
import { presentError } from "@/views/error.view";
import { presentExpiration } from "@/views/expiration.view";

// Registra a validade de um alimento
export async function registerExpiration(input: unknown, userId: string): Promise<ControllerResponse> {
  try {
    const data = expirationInputSchema.parse(input);

    let name = data.name;
    if (data.productId) {
      const product = (await catalogRepository.load()).products.find(p => p.id === data.productId);
      if (!product) return { status: 404, body: presentError("Produto não encontrado") };
      name = name ?? product.name;
    }

    const item = await expirationRepository.save({
      name: name as string,
      productId: data.productId,
      expirationDate: data.expirationDate,
    }, userId);
    return { status: 201, body: presentExpiration(item, todayISO()) };
  } catch (error) {
    return handleError(error);
  }
}

// Lista os alimentos ordenados do que vence primeiro para o último
export async function listExpirations(userId: string): Promise<ControllerResponse> {
  try {
    const today = todayISO();
    const body = sortByExpiration(await expirationRepository.list(userId)).map((item) => presentExpiration(item, today));
    return { status: 200, body };
  } catch (error) {
    return handleError(error);
  }
}
