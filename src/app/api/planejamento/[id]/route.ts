import { getPlanning } from "@/controllers/planning.controller";
import { respond } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/planejamento/:id
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return respond(getPlanning(id));
}
