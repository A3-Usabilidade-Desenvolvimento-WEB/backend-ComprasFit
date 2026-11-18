import type { SeedData } from "@/data/seed";
import { productRepository } from "./product.repository";
import { recipeRepository } from "./recipe.repository";
import { priceRepository } from "./price.repository";
import { isAllowedProductName, normalizeProductName } from "@/data/allowed-products";
import { getSupabase, usesSupabase } from "@/lib/supabase";

export const catalogRepository = {
  async load(): Promise<SeedData> {
    if (!usesSupabase()) return {
      products: productRepository.list(), recipes: recipeRepository.list(), prices: [...priceRepository.latestByProduct().values()],
    };
    const { data, error } = await getSupabase().rpc("comprasfit_catalog");
    if (error) throw error;
    return data;
  },
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
