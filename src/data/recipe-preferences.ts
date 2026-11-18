import type { Recipe } from "@/models/recipe";

// Curated for the base recipes. Unknown recipes have no verified attributes.
export type RecipePreferences = { restrictions: string[]; appliances: string[]; goals: string[] };
const stove = ["Fogão"];
export const recipePreferences: Record<string, RecipePreferences> = {
  "arroz-feijao-frango": { restrictions: ["Peixe", "Glúten"], appliances: stove, goals: ["Rico em proteína", "Refeição de família"] },
  "macarrao-molho-tomate": { restrictions: ["Vegetariano", "Vegano", "Peixe"], appliances: stove, goals: ["Refeição prática", "Conforto e sabor"] },
  "omelete-arroz-legumes": { restrictions: ["Vegetariano", "Peixe", "Glúten"], appliances: stove, goals: ["Refeição prática", "Rico em proteína"] },
  "carne-moida-batata-doce": { restrictions: ["Peixe", "Glúten"], appliances: stove, goals: ["Rico em proteína", "Conforto e sabor"] },
  "lentilha-arroz-cenoura": { restrictions: ["Vegetariano", "Vegano", "Peixe", "Glúten"], appliances: stove, goals: ["Refeição leve", "Diferente"] },
  "frango-brocolis-arroz": { restrictions: ["Peixe", "Glúten"], appliances: stove, goals: ["Refeição leve", "Refeição de família"] },
  "mingau-aveia-banana": { restrictions: ["Vegetariano", "Peixe"], appliances: stove, goals: ["Lanche caseiro", "Refeição prática"] },
};

export function isVeganRecipe(recipe: Recipe): boolean {
  return recipe.vegetarian && (recipe.preferences ?? recipePreferences[recipe.id])?.restrictions.includes("Vegano") === true;
}
