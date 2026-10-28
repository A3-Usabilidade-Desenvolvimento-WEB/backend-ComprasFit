import { listRecipes } from "@/controllers/recipe.controller";
import { corsPreflight } from "@/lib/cors";
import { respond } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/receitas
export async function GET(request: Request) {
  return respond(listRecipes(), request);
}

export function OPTIONS(request: Request) { return corsPreflight(request); }
