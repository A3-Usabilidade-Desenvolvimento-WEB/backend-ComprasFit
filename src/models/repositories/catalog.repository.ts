import { isAllowedProductName, normalizeProductName } from "@/data/allowed-products";
import { getSupabase, usesSupabase } from "@/lib/supabase";

export const catalogRepository = {
  async isAuthorizedName(name: string): Promise<boolean> {
    if (!usesSupabase()) return isAllowedProductName(name);

    const { data, error } = await getSupabase()
      .from("products")
      .select("id")
      .eq("normalized_name", normalizeProductName(name))
      .eq("active", true)
      .maybeSingle();

    if (error) throw new Error(`Falha ao consultar o catálogo autorizado: ${error.message}`);
    return data !== null;
  },
};
