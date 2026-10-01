import { listProducts } from "@/controllers/product.controller";
import { respond } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/produtos
export async function GET() {
  return respond(listProducts());
}
