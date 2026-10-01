import { handleError } from "@/controllers/handle-error";
import { generatePlanning } from "@/lib/planning/generate-planning";
import { suggestAdjustments } from "@/lib/planning/suggest-adjustments";
import { planningRepository } from "@/models/repositories/planning.repository";
import { priceRepository } from "@/models/repositories/price.repository";
import { productRepository } from "@/models/repositories/product.repository";
import { recipeRepository } from "@/models/repositories/recipe.repository";
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
export function createPlanning(input: unknown): ControllerResponse {
  try {
    const params = planningInputSchema.parse(input);

    const catalog = {
      products: new Map(productRepository.list().map((product) => [product.id, product])),
      prices: priceRepository.latestByProduct(),
    };
    const draft = generatePlanning(params, recipeRepository.list(), catalog);

    if (!draft.fitsBudget) {
      return { status: 422, body: presentOverBudget(draft, suggestAdjustments(draft)) };
    }

    const planning = planningRepository.save(draft);
    return { status: 201, body: presentPlanning(planning) };
  } catch (error) {
    return handleError(error);
  }
}

// Lista o histórico de planejamentos salvos
export function listPlannings(): ControllerResponse {
  try {
    return { status: 200, body: planningRepository.list().map(presentPlanningSummary) };
  } catch (error) {
    return handleError(error);
  }
}

// Busca um planejamento salvo pelo id
export function getPlanning(id: string): ControllerResponse {
  try {
    const planning = planningRepository.findById(id);
    if (!planning) return { status: 404, body: presentError("Planejamento não encontrado") };
    return { status: 200, body: presentPlanning(planning) };
  } catch (error) {
    return handleError(error);
  }
}

// Marca ou desmarca um item da lista de compras como comprado
export function setItemPurchased(planningId: string, itemId: string, input: unknown): ControllerResponse {
  try {
    const { purchased } = purchaseInputSchema.parse(input);

    const planning = planningRepository.findById(planningId);
    if (!planning) return { status: 404, body: presentError("Planejamento não encontrado") };

    const item = planning.shoppingList.items.find((candidate) => candidate.id === itemId);
    if (!item) return { status: 404, body: presentError("Item não encontrado na lista de compras") };

    item.purchased = purchased;
    return { status: 200, body: presentShoppingItem(item) };
  } catch (error) {
    return handleError(error);
  }
}
