import { z } from "zod";

// Corpo da requisição de sugestão: usa um planejamento já salvo
export const suggestionInputSchema = z.object(
  { planningId: z.string({ error: "O planningId é obrigatório" }).min(1, "O planningId é obrigatório") },
  { error: "Corpo da requisição inválido" },
);

// Formato esperado da resposta da IA
export const aiResponseSchema = z.object({
  suggestions: z
    .array(
      z.object({
        name: z.string().min(1),
        ingredients: z.array(z.string().min(1)).min(1),
        steps: z.array(z.string().min(1)).min(1),
      }),
    )
    .min(1)
    .max(5),
});
