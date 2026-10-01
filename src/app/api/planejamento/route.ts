import { createPlanning, listPlannings } from "@/controllers/planning.controller";
import { readJson, respond } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/planejamento
export async function GET() {
  return respond(listPlannings());
}

// POST /api/planejamento
export async function POST(request: Request) {
  return respond(createPlanning(await readJson(request)));
}
