import { suggestRecipes } from "@/controllers/suggestion.controller";
import { readJson, respond } from "@/lib/http";

// POST /api/ia/sugestao
export async function POST(request: Request) {
  return respond(await suggestRecipes(await readJson(request)));
}
