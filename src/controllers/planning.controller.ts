import { catalogRepository } from "@/models/repositories/catalog.repository";
import { handleError } from "@/controllers/handle-error";
import { generatePlanning } from "@/lib/planning/generate-planning";
import { suggestAdjustments } from "@/lib/planning/suggest-adjustments";
import { planningRepository } from "@/models/repositories/planning.repository";
import { planningInputSchema, purchaseInputSchema } from "@/schemas/planning.schema";
import type { ControllerResponse } from "@/types/http";
import { presentError } from "@/views/error.view";
import {
  presentOverBudget,
  presentPlanning,
  presentPlanningSummary,
  presentShoppingItem,
} from "@/views/planning.view";

// Valida os parâmetros, gera o planejamento e salva se couber no orçamento
export async function createPlanning(input: unknown, userId: string): Promise<ControllerResponse> {
  try {
    const params = planningInputSchema.parse(input);

    const data = await catalogRepository.load();
    const catalog = {
      products: new Map(data.products.map((product) => [product.id, product])),
      prices: new Map(data.prices.map(price => [price.productId, price])),
    };
    const draft = generatePlanning(params, data.recipes, catalog);

    if (!draft.fitsBudget) {
      return { status: 422, body: presentOverBudget(draft, suggestAdjustments(draft)) };
    }

    const planning = await planningRepository.save(draft, userId);
    return { status: 201, body: presentPlanning(planning) };
  } catch (error) {
    return handleError(error);
  }
}

// Lista o histórico de planejamentos salvos
export async function listPlannings(userId: string): Promise<ControllerResponse> {
  try {
    return { status: 200, body: (await planningRepository.list(userId)).map(presentPlanningSummary) };
  } catch (error) {
    return handleError(error);
  }
}

// Busca um planejamento salvo pelo id
export async function getPlanning(id: string, userId: string): Promise<ControllerResponse> {
  try {
    const planning = await planningRepository.findById(id, userId);
    if (!planning) return { status: 404, body: presentError("Planejamento não encontrado") };
    return { status: 200, body: presentPlanning(planning) };
  } catch (error) {
    return handleError(error);
  }
}

// Marca ou desmarca um item da lista de compras como comprado
export async function setItemPurchased(planningId: string, itemId: string, input: unknown, userId: string): Promise<ControllerResponse> {
  try {
    const { purchased } = purchaseInputSchema.parse(input);

    const planning = await planningRepository.findById(planningId, userId);
    if (!planning) return { status: 404, body: presentError("Planejamento não encontrado") };

    const item = await planningRepository.mark(planning, itemId, purchased);
    if (!item) return { status: 404, body: presentError("Item não encontrado na lista de compras") };

    return { status: 200, body: presentShoppingItem(item) };
  } catch (error) {
    return handleError(error);
  }
}
