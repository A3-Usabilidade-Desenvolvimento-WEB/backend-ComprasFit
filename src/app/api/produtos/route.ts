import { listProducts } from "@/controllers/product.controller";
import { corsPreflight } from "@/lib/cors";
import { respond } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/produtos
export async function GET(request: Request) {
  return respond(listProducts(), request);
}

export function OPTIONS(request: Request) { return corsPreflight(request); }
