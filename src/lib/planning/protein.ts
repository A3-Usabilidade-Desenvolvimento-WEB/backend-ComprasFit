import type { Product } from "@/models/product";
import type { Recipe, RecipeIngredient } from "@/models/recipe";

export function isMainProtein(ingredient: RecipeIngredient, product?: Product): boolean {
  return ingredient.mainProtein === true && ingredient.quantity > 0 &&
    (product?.foodRole === "Proteína animal" || product?.foodRole === "Proteína vegetal");
}

export function hasProteinMain(recipe: Recipe, products: Map<string, Product>): boolean {
  return recipe.ingredients.some(ingredient => isMainProtein(ingredient, products.get(ingredient.productId)));
}
