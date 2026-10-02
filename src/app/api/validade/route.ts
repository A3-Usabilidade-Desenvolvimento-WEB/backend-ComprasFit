import { listExpirations, registerExpiration } from "@/controllers/expiration.controller";
import { readJson, respond } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/validade
export async function GET() {
  return respond(listExpirations());
}

// POST /api/validade
export async function POST(request: Request) {
  return respond(registerExpiration(await readJson(request)));
}
