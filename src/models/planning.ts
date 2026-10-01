export type BuyingPreference = "lowest_price" | "variety";

export interface PlanningParams {
  // Orçamento em reais
  budget: number;
  periodDays: number;
  people: number;
  mealsPerDay: number;
  buyingPreference: BuyingPreference;
  vegetarian: boolean;
  recipeIds?: string[];
}

export interface PlanningMeal {
  day: number;
  slot: number;
  recipeId: string;
  recipeName: string;
}

export interface ShoppingItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  unit: string;
  quantityNeeded: number;
  packageSize: number;
  packages: number;
  leftover: number;
  unitPriceCents: number;
  subtotalCents: number;
  purchased: boolean;
}

export interface ShoppingList {
  items: ShoppingItem[];
  totalCents: number;
}

// Resultado do cálculo, ainda sem ser salvo
export interface PlanningDraft {
  params: PlanningParams;
  budgetCents: number;
  meals: PlanningMeal[];
  shoppingList: ShoppingList;
  fitsBudget: boolean;
  // Orçamento menos o total (negativo quando estoura)
  differenceCents: number;
}

export interface Planning extends PlanningDraft {
  id: string;
  createdAt: string;
}
