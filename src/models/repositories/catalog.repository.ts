import type { SeedData } from "@/data/seed";
import { productRepository } from "./product.repository";
import { recipeRepository } from "./recipe.repository";
import { priceRepository } from "./price.repository";
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
};
