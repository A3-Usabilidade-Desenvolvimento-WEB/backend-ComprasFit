export interface RecipeIngredient {
  productId: string;
  // Quantidade para o total de porções da receita, na unidade do produto
  quantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  // Número de porções que a receita rende
  servings: number;
  vegetarian: boolean;
  ingredients: RecipeIngredient[];
  // Passos de preparo usados quando a IA não responde
  basePreparation: string[];
}
