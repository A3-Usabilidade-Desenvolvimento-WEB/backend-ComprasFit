import { setItemPurchased } from "@/controllers/planning.controller";
import { readJson, respond } from "@/lib/http";

// PATCH /api/planejamento/:id/itens/:itemId
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await params;
  return respond(setItemPurchased(id, itemId, await readJson(request)));
}
