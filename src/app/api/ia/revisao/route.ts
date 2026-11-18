import { reviewPlan } from "@/controllers/plan-review.controller";
import { requireAuthenticatedUser } from "@/lib/auth";
import { corsPreflight } from "@/lib/cors";
import { readJson, respond } from "@/lib/http";

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if (!auth.ok) return auth.response;
  return respond(await reviewPlan(await readJson(request), auth.user.id), request);
}

export function OPTIONS(request: Request) { return corsPreflight(request); }
