import { z } from "zod";
import { isValidISODate } from "@/lib/date";

// Registro de validade: exige a data e o produto (id ou nome)
export const expirationInputSchema = z
  .object(
    {
      productId: z.string().min(1).optional(),
      name: z.string().trim().min(1, "O nome não pode ser vazio").max(100).optional(),
      expirationDate: z
        .string({ error: "A data de validade é obrigatória" })
        .refine(isValidISODate, "A data de validade deve estar no formato AAAA-MM-DD e ser uma data real"),
    },
    { error: "Corpo da requisição inválido" },
  )
  .refine((data) => data.productId || data.name, {
    message: "Informe o productId ou o name do alimento",
    path: ["name"],
  });

export type ExpirationInput = z.infer<typeof expirationInputSchema>;
