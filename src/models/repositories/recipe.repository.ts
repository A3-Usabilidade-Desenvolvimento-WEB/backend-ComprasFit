import { getStore } from "@/models/store";
import type { Recipe } from "@/models/recipe";

export const recipeRepository = {
  // Lista todas as receitas
  list(): Recipe[] {
    return getStore().recipes;
  },

  // Busca uma receita pelo id
  findById(id: string): Recipe | undefined {
    return getStore().recipes.find((recipe) => recipe.id === id);
  },
};
