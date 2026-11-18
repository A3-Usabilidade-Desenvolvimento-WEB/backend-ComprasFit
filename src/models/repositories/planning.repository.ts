import { randomUUID } from "node:crypto";
import { getSupabase, usesSupabase } from "@/lib/supabase";
import { getStore } from "@/models/store";
import type { Planning, PlanningDraft } from "@/models/planning";

async function readPlans(userId: string, id?: string): Promise<Planning[]> {
  if (!usesSupabase()) return getStore().plannings.filter(p => p.userId === userId && (!id || p.id === id)).reverse();
  if (id && !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) return [];
  const { data, error } = await getSupabase().rpc("read_comprasfit_plans", { owner_id: userId, plan_id: id ?? null });
  if (error) throw error;
  return data;
}

export const planningRepository = {
  async save(draft: PlanningDraft, userId: string): Promise<Planning> {
    const planning = { ...draft, id: randomUUID(), createdAt: new Date().toISOString() };
    if (usesSupabase()) {
      const { error } = await getSupabase().rpc("save_comprasfit_plan", { owner_id: userId, plan: planning });
      if (error) throw error;
    } else getStore().plannings.push({ ...planning, userId });
    return planning;
  },
  list: readPlans,
  async findById(id: string, userId: string) {
    return (await readPlans(userId, id))[0];
  },
  // The caller retrieves this user's plan first. Each update targets one item.
  async mark(planning: Planning, itemId: string, purchased: boolean) {
    const item = planning.shoppingList.items.find(i => i.id === itemId);
    if (!item) return;
    if (usesSupabase()) {
      const { error } = await getSupabase().from("planning_items").update({ purchased })
        .eq("planning_id", planning.id).eq("id", itemId).select("id").single();
      if (error) throw error;
    }
    item.purchased = purchased;
    return item;
  },
};
