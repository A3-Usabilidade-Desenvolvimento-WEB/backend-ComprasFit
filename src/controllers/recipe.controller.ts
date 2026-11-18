import { catalogRepository } from "@/models/repositories/catalog.repository";
import { handleError } from "@/controllers/handle-error";
import type { ControllerResponse } from "@/types/http";
import { presentRecipe } from "@/views/recipe.view";

// Lista as receitas-base com seus ingredientes
export async function listRecipes(): Promise<ControllerResponse> {
  try {
    const data = await catalogRepository.load();
    const products = new Map(data.products.map((product) => [product.id, product]));
    const body = data.recipes.map((recipe) => presentRecipe(recipe, products));
    return { status: 200, body };
  } catch (error) {
    return handleError(error);
  }
}
