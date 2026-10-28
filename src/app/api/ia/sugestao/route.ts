import { suggestRecipes } from "@/controllers/suggestion.controller";
import { requireAuthenticatedUser } from "@/lib/auth";
import { corsPreflight } from "@/lib/cors";
import { readJson, respond } from "@/lib/http";

// POST /api/ia/sugestao
export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if (!auth.ok) return auth.response;
  return respond(await suggestRecipes(await readJson(request)), request);
}

export function OPTIONS(request: Request) { return corsPreflight(request); }
