import { handleError } from "@/controllers/handle-error";
import { prioritizeTips } from "@/lib/gemini";
import { planningRepository } from "@/models/repositories/planning.repository";
import { z } from "zod";
import { presentError } from "@/views/error.view";
import type { ControllerResponse } from "@/types/http";

const reviewInput = z.object({ planningId: z.string().min(1).max(100) });

export async function reviewPlan(input: unknown, userId: string): Promise<ControllerResponse> {
  try {
    const { planningId } = reviewInput.parse(input);
    const plan = await planningRepository.findById(planningId, userId);
    if (!plan) return { status: 404, body: presentError("Planejamento não encontrado") };

    const { people, periodDays, mealsPerDay, mealKind } = plan.params;
    const recipes = new Set(plan.meals.map(meal => meal.recipeId)).size;
    const budgetPercent = Math.round(plan.shoppingList.totalCents * 100 / plan.budgetCents);
    const tips = new Map<string, string>();
    if (mealsPerDay === 1 && mealKind !== "snack") {
      tips.set("cobrir_almoco_e_jantar", "Para incluir almoço e jantar no valor, edite o planejamento e selecione as duas refeições por dia.");
    }
    tips.set("comparar_precos_com_o_mercado", "Compare os valores da lista com os do supermercado. As embalagens são calculadas pelo app e os preços são referências acadêmicas.");
    if (recipes < plan.meals.length) {
      tips.set("variar_receitas_repetidas", "Use as sugestões do catálogo para procurar alternativas e trocar refeições repetidas. O total é recalculado na troca.");
    }
    if (plan.shoppingList.items.some(item => item.leftover > 0)) {
      tips.set("aproveitar_sobra_das_embalagens", "Consulte as sugestões para aproveitar ingredientes que já estão na lista. O valor estimado inclui as embalagens inteiras.");
    }
    tips.set("revisar_o_que_ficou_fora_da_lista", "Reserve parte do orçamento para as demais refeições e os itens que ficaram de fora das receitas escolhidas.");

    const ids = [...tips.keys()];
    const chosen = await prioritizeTips(ids, { people, periodDays, mealsPerDay, meals: plan.meals.length, recipes, budgetPercent });
    return { status: 200, body: { source: chosen ? "gemini" : "rules", tips: (chosen ?? ids.slice(0, 2)).map(id => tips.get(id)!) } };
  } catch (error) {
    return handleError(error);
  }
}
