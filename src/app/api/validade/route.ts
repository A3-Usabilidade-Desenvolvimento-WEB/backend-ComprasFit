import { listExpirations, registerExpiration } from "@/controllers/expiration.controller";
import { requireAuthenticatedUser } from "@/lib/auth";
import { corsPreflight } from "@/lib/cors";
import { readJson, respond } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/validade
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if (!auth.ok) return auth.response;
  return respond(listExpirations(), request);
}

// POST /api/validade
export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if (!auth.ok) return auth.response;
  return respond(registerExpiration(await readJson(request)), request);
}

export function OPTIONS(request: Request) { return corsPreflight(request); }
