import type { Product } from "@/models/product";
import type { Recipe } from "@/models/recipe";

// Formata uma receita com o nome dos ingredientes
export function presentRecipe(recipe: Recipe, products: Map<string, Product>) {
  return {
    id: recipe.id,
    name: recipe.name,
    servings: recipe.servings,
    vegetarian: recipe.vegetarian,
    ingredients: recipe.ingredients.map((ingredient) => {
      const product = products.get(ingredient.productId);
      return {
        productId: ingredient.productId,
        name: product?.name ?? ingredient.productId,
        quantity: ingredient.quantity,
        unit: product?.unit ?? null,
      };
    }),
  };
}
