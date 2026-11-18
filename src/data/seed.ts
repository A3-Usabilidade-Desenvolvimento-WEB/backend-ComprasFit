import type { FoodRole, Product } from "@/models/product";
import type { Price } from "@/models/price";
import type { Recipe } from "@/models/recipe";

export interface SeedData {
  products: Product[];
  prices: Price[];
  recipes: Recipe[];
}

const STORE = "Supermercado Exemplo";
const UPDATED_AT = "2026-09-01";

// Produtos: id, nome, categoria, unidade, tamanho da embalagem, preço em centavos
const productRows: [string, string, string, Product["unit"], number, number, FoodRole][] = [
  ["arroz", "Arroz branco 5kg", "Grãos", "g", 5000, 2790, "Carboidrato"],
  ["feijao", "Feijão carioca 1kg", "Grãos", "g", 1000, 849, "Proteína vegetal"],
  ["lentilha", "Lentilha 500g", "Grãos", "g", 500, 799, "Proteína vegetal"],
  ["macarrao", "Macarrão espaguete 500g", "Grãos", "g", 500, 499, "Carboidrato"],
  ["aveia", "Aveia em flocos 170g", "Grãos", "g", 170, 429, "Carboidrato"],
  ["frango", "Peito de frango 1kg", "Carnes", "g", 1000, 1890, "Proteína animal"],
  ["carne-moida", "Carne moída 500g", "Carnes", "g", 500, 1790, "Proteína animal"],
  ["ovos", "Ovos (dúzia)", "Laticínios e ovos", "un", 12, 1150, "Proteína animal"],
  ["leite", "Leite integral 1L", "Laticínios e ovos", "ml", 1000, 529, "Laticínio"],
  ["cebola", "Cebola 1kg", "Hortifruti", "g", 1000, 690, "Hortaliça"],
  ["tomate", "Tomate 1kg", "Hortifruti", "g", 1000, 890, "Hortaliça"],
  ["batata-doce", "Batata-doce 1kg", "Hortifruti", "g", 1000, 750, "Carboidrato"],
  ["brocolis", "Brócolis (maço 300g)", "Hortifruti", "g", 300, 550, "Hortaliça"],
  ["cenoura", "Cenoura 1kg", "Hortifruti", "g", 1000, 590, "Hortaliça"],
  ["banana", "Banana prata 1kg", "Hortifruti", "g", 1000, 649, "Fruta"],
  ["molho-tomate", "Molho de tomate 340g", "Mercearia", "g", 340, 279, "Molho"],
  ["oleo", "Óleo de soja 900ml", "Mercearia", "ml", 900, 749, "Gordura"],
];

// Cria uma cópia nova dos dados iniciais a cada chamada
export function createSeedData(): SeedData {
  const products: Product[] = productRows.map(([id, name, category, unit, packageSize, , foodRole]) => ({
    id,
    name,
    category,
    unit,
    packageSize,
    foodRole,
  }));

  const prices: Price[] = productRows.map(([id, , , , , priceCents]) => ({
    id: `price-${id}`,
    productId: id,
    store: STORE,
    priceCents,
    updatedAt: UPDATED_AT,
  }));

  const recipes: Recipe[] = [
    {
      id: "arroz-feijao-frango",
      name: "Arroz, feijão e frango grelhado",
      servings: 2,
      vegetarian: false,
      ingredients: [
        { productId: "arroz", quantity: 160 },
        { productId: "feijao", mainProtein: true, quantity: 100 },
        { productId: "frango", mainProtein: true, quantity: 300 },
        { productId: "cebola", quantity: 50 },
        { productId: "oleo", quantity: 10 },
      ],
      basePreparation: [
        "Cozinhe o arroz e o feijão separadamente.",
        "Tempere o frango e grelhe até dourar dos dois lados.",
        "Refogue a cebola no óleo e misture ao feijão.",
        "Sirva tudo junto.",
      ],
    },
    {
      id: "macarrao-molho-tomate",
      name: "Macarrão ao molho de tomate",
      servings: 2,
      vegetarian: true,
      ingredients: [
        { productId: "macarrao", quantity: 200 },
        { productId: "molho-tomate", quantity: 170 },
        { productId: "cebola", quantity: 50 },
        { productId: "oleo", quantity: 10 },
      ],
      basePreparation: [
        "Cozinhe o macarrão em água fervente até ficar al dente.",
        "Refogue a cebola no óleo e adicione o molho de tomate.",
        "Misture o macarrão ao molho e sirva.",
      ],
    },
    {
      id: "omelete-arroz-legumes",
      name: "Omelete com arroz e legumes",
      servings: 2,
      vegetarian: true,
      ingredients: [
        { productId: "ovos", mainProtein: true, quantity: 4 },
        { productId: "arroz", quantity: 120 },
        { productId: "tomate", quantity: 100 },
        { productId: "cebola", quantity: 50 },
        { productId: "oleo", quantity: 10 },
      ],
      basePreparation: [
        "Cozinhe o arroz.",
        "Pique o tomate e a cebola e refogue no óleo.",
        "Bata os ovos, despeje sobre os legumes e deixe firmar.",
        "Sirva a omelete com o arroz.",
      ],
    },
    {
      id: "carne-moida-batata-doce",
      name: "Carne moída com batata-doce",
      servings: 2,
      vegetarian: false,
      ingredients: [
        { productId: "carne-moida", mainProtein: true, quantity: 300 },
        { productId: "batata-doce", quantity: 400 },
        { productId: "cebola", quantity: 50 },
        { productId: "tomate", quantity: 100 },
      ],
      basePreparation: [
        "Cozinhe a batata-doce em pedaços até ficar macia.",
        "Refogue a cebola, adicione a carne moída e o tomate picado.",
        "Cozinhe até a carne secar e sirva com a batata-doce.",
      ],
    },
    {
      id: "lentilha-arroz-cenoura",
      name: "Lentilha com arroz e cenoura",
      servings: 2,
      vegetarian: true,
      ingredients: [
        { productId: "lentilha", mainProtein: true, quantity: 200 },
        { productId: "arroz", quantity: 120 },
        { productId: "cenoura", quantity: 100 },
        { productId: "cebola", quantity: 50 },
      ],
      basePreparation: [
        "Cozinhe a lentilha com a cenoura ralada até ficar macia.",
        "Refogue a cebola e misture à lentilha.",
        "Cozinhe o arroz e sirva junto.",
      ],
    },
    {
      id: "frango-brocolis-arroz",
      name: "Frango com brócolis e arroz",
      servings: 2,
      vegetarian: false,
      ingredients: [
        { productId: "frango", mainProtein: true, quantity: 300 },
        { productId: "brocolis", quantity: 300 },
        { productId: "arroz", quantity: 120 },
      ],
      basePreparation: [
        "Corte o frango em cubos e doure em uma panela.",
        "Cozinhe o brócolis no vapor por alguns minutos.",
        "Cozinhe o arroz e sirva tudo junto.",
      ],
    },
    {
      id: "mingau-aveia-banana",
      name: "Mingau de aveia com banana",
      servings: 2,
      vegetarian: true,
      ingredients: [
        { productId: "aveia", quantity: 80 },
        { productId: "leite", quantity: 400 },
        { productId: "banana", quantity: 200 },
      ],
      basePreparation: [
        "Aqueça o leite com a aveia mexendo até engrossar.",
        "Amasse a banana e misture ao mingau.",
        "Sirva morno.",
      ],
    },
  ];

  return { products, prices, recipes };
}
