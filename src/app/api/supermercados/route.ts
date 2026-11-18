import { listStores } from "@/controllers/store.controller";
import { corsPreflight } from "@/lib/cors";
import { respond } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return respond(await listStores(), request);
}

export function OPTIONS(request: Request) {
  return corsPreflight(request);
}
