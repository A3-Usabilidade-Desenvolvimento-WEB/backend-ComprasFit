import { hasProteinMain, isMainProtein } from "@/lib/planning/protein";
import { recipePreferences } from "@/data/recipe-preferences";
import type { Product } from "@/models/product";
import type { Recipe } from "@/models/recipe";

// Formata uma receita com o nome dos ingredientes
export function presentRecipe(recipe: Recipe, products: Map<string, Product>) {
  const proteinMain = hasProteinMain(recipe, products);
  const preferences = recipe.preferences ?? recipePreferences[recipe.id] ?? {
    restrictions: recipe.vegetarian ? ["Vegetariano"] : [], appliances: [], goals: [],
  };
  const goals = preferences.goals.filter(goal => goal !== "Rico em proteína");
  if (proteinMain) goals.push("Rico em proteína");
  return {
    id: recipe.id,
    name: recipe.name,
    servings: recipe.servings,
    vegetarian: recipe.vegetarian,
    preparationMinutes: recipe.preparationMinutes ?? null,
    hasProteinMain: proteinMain,
    preferences: { ...preferences, goals },
    steps: recipe.basePreparation,
    ingredients: recipe.ingredients.map((ingredient) => {
      const product = products.get(ingredient.productId);
      return {
        productId: ingredient.productId,
        name: product?.name ?? ingredient.productId,
        foodRole: product?.foodRole ?? null,
        mainProtein: isMainProtein(ingredient, product),
        quantity: ingredient.quantity,
        unit: product?.unit ?? null,
      };
    }),
  };
}
