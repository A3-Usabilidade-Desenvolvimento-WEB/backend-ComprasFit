import { hasProteinMain } from "@/lib/planning/protein";
import type { Product } from "@/models/product";
import type { Recipe } from "@/models/recipe";

export type MealKind = "main" | "snack" | "side";

const mainDishes = new Set(["macarrao-molho-tomate", "macarrao-brocolis", "arroz-cremoso-brocolis"]);
const snacks = new Set(["mingau-de-aveia", "mingau-aveia-banana", "mingau-microondas", "bolo-banana-aveia", "panqueca-banana-aveia"]);

export function mealKind(recipe: Recipe, products: Map<string, Product>): MealKind {
  if (hasProteinMain(recipe, products) || mainDishes.has(recipe.id)) return "main";
  if (snacks.has(recipe.id)) return "snack";
  return "side";
}
