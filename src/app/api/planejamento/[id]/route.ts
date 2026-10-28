import { getPlanning } from "@/controllers/planning.controller";
import { requireAuthenticatedUser } from "@/lib/auth";
import { corsPreflight } from "@/lib/cors";
import { respond } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/planejamento/:id
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthenticatedUser(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  return respond(getPlanning(id), request);
}

export function OPTIONS(request: Request) { return corsPreflight(request); }
