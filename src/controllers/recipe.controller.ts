import { handleError } from "@/controllers/handle-error";
import { productRepository } from "@/models/repositories/product.repository";
import { recipeRepository } from "@/models/repositories/recipe.repository";
import type { ControllerResponse } from "@/types/http";
import { presentRecipe } from "@/views/recipe.view";

// Lista as receitas-base com seus ingredientes
export function listRecipes(): ControllerResponse {
  try {
    const products = new Map(productRepository.list().map((product) => [product.id, product]));
    const body = recipeRepository.list().map((recipe) => presentRecipe(recipe, products));
    return { status: 200, body };
  } catch (error) {
    return handleError(error);
  }
}
