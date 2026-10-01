import { randomUUID } from "node:crypto";
import { getStore } from "@/models/store";
import type { Planning, PlanningDraft } from "@/models/planning";

export const planningRepository = {
  // Salva um planejamento novo e devolve com id e data
  save(draft: PlanningDraft): Planning {
    const planning: Planning = { ...draft, id: randomUUID(), createdAt: new Date().toISOString() };
    getStore().plannings.push(planning);
    return planning;
  },

  // Lista os planejamentos do mais recente para o mais antigo
  list(): Planning[] {
    return [...getStore().plannings].reverse();
  },

  // Busca um planejamento pelo id
  findById(id: string): Planning | undefined {
    return getStore().plannings.find((planning) => planning.id === id);
  },
};
