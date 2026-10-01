import { NextResponse } from "next/server";
import type { ControllerResponse } from "@/types/http";

// Lê o corpo JSON da requisição (undefined se for inválido)
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

// Converte a resposta do controller em resposta HTTP do Next.js
export function respond(result: ControllerResponse): NextResponse {
  return NextResponse.json(result.body, { status: result.status });
}
