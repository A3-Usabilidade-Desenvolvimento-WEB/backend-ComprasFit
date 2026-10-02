export interface BudgetCheck {
  fits: boolean;
  // Orçamento menos o total (negativo quando estoura)
  differenceCents: number;
}

// Verifica se o custo total cabe no orçamento
export function checkBudget(totalCents: number, budgetCents: number): BudgetCheck {
  return { fits: totalCents <= budgetCents, differenceCents: budgetCents - totalCents };
}
