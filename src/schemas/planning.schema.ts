import { z } from "zod";

// Planejamento: valida orçamento, período, pessoas e preferências
export const planningInputSchema = z.object(
  {
    budget: z
      .number({ error: "O orçamento é obrigatório e deve ser um número" })
      .positive("O orçamento deve ser maior que zero")
      .max(100_000, "O orçamento máximo é R$ 100.000"),
    periodDays: z
      .number({ error: "O período é obrigatório e deve ser um número" })
      .int("O período deve ser um número inteiro de dias")
      .min(1, "O período deve ter pelo menos 1 dia")
      .max(31, "O período máximo é de 31 dias"),
    people: z
      .number({ error: "A quantidade de pessoas é obrigatória e deve ser um número" })
      .int("A quantidade de pessoas deve ser um número inteiro")
      .min(1, "É necessário pelo menos 1 pessoa")
      .max(20, "O máximo é de 20 pessoas"),
    mealsPerDay: z
      .number({ error: "As refeições por dia devem ser um número" })
      .int("As refeições por dia devem ser um número inteiro")
      .min(1, "É necessário pelo menos 1 refeição por dia")
      .max(4, "O máximo é de 4 refeições por dia")
      .default(2),
    buyingPreference: z
      .enum(["lowest_price", "variety"], { error: "A preferência de compra deve ser lowest_price ou variety" })
      .default("lowest_price"),
    vegetarian: z.boolean({ error: "A opção vegetariana deve ser verdadeiro ou falso" }).default(false),
    recipeIds: z.array(z.string()).optional(),
  },
  { error: "Corpo da requisição inválido" },
);

export type PlanningInput = z.infer<typeof planningInputSchema>;

// Marcação de item comprado
export const purchaseInputSchema = z.object(
  { purchased: z.boolean({ error: "O campo purchased deve ser verdadeiro ou falso" }) },
  { error: "Corpo da requisição inválido" },
);
