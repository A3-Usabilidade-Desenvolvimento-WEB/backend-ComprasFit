export type Unit = "g" | "ml" | "un";

export type FoodRole = "Carboidrato" | "Proteína vegetal" | "Proteína animal" | "Laticínio" | "Hortaliça" | "Fruta" | "Molho" | "Gordura";

export interface Product {
  id: string;
  name: string;
  category: string;
  foodRole?: FoodRole | null;
  // Unidade usada nas quantidades das receitas
  unit: Unit;
  // Quantidade que vem em uma embalagem, na mesma unidade
  packageSize: number;
}
