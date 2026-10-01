import { ZodError } from "zod";
import { AppError } from "@/lib/errors";
import type { ControllerResponse } from "@/types/http";
import { presentError } from "@/views/error.view";

// Converte qualquer erro em resposta HTTP (400 validação, status do AppError ou 500)
export function handleError(error: unknown): ControllerResponse {
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return { status: 400, body: presentError("Dados inválidos", details) };
  }
  if (error instanceof AppError) {
    return { status: error.status, body: presentError(error.message) };
  }
  console.error(error);
  return { status: 500, body: presentError("Erro interno do servidor") };
}
