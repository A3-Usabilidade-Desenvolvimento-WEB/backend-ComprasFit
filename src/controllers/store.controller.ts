import { handleError } from "@/controllers/handle-error";
import { getSupabase, usesSupabase } from "@/lib/supabase";
import type { ControllerResponse } from "@/types/http";

export async function listStores(): Promise<ControllerResponse> {
  try {
    if (!usesSupabase()) return {
      status: 200,
      body: ["Supermercados BH", "Villefort", "Verdemar", "Assaí", "Supernosso", "Carrefour", "Mart Minas", "Prata"],
    };
    const { data, error } = await getSupabase().from("stores").select("name")
      .eq("selectable", true).order("selection_order").order("name");
    if (error) throw error;
    return { status: 200, body: data.map(store => store.name) };
  } catch (error) {
    return handleError(error);
  }
}
