export type Unit = "g" | "ml" | "un";

export interface Product {
  id: string;
  name: string;
  category: string;
  // Unidade usada nas quantidades das receitas
  unit: Unit;
  // Quantidade que vem em uma embalagem, na mesma unidade
  packageSize: number;
}
