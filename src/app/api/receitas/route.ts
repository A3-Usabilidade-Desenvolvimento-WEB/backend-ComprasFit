import { listRecipes } from "@/controllers/recipe.controller";
import { respond } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/receitas
export async function GET() {
  return respond(listRecipes());
}
