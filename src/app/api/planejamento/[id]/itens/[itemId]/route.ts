import { setItemPurchased } from "@/controllers/planning.controller";
import { requireAuthenticatedUser } from "@/lib/auth";
import { corsPreflight } from "@/lib/cors";
import { readJson, respond } from "@/lib/http";

// PATCH /api/planejamento/:id/itens/:itemId
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const auth = await requireAuthenticatedUser(request);
  if (!auth.ok) return auth.response;
  const { id, itemId } = await params;
  return respond(setItemPurchased(id, itemId, await readJson(request)), request);
}

export function OPTIONS(request: Request) { return corsPreflight(request); }
