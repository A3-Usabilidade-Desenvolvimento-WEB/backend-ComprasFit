import { createPlanning, listPlannings } from "@/controllers/planning.controller";
import { requireAuthenticatedUser } from "@/lib/auth";
import { corsPreflight } from "@/lib/cors";
import { readJson, respond } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/planejamento
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if (!auth.ok) return auth.response;
  return respond(listPlannings(), request);
}

// POST /api/planejamento
export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if (!auth.ok) return auth.response;
  return respond(createPlanning(await readJson(request)), request);
}

export function OPTIONS(request: Request) { return corsPreflight(request); }
