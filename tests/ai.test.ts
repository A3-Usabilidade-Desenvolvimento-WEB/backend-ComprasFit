import { describe, expect, it } from "vitest";
import { validateAiSuggestions } from "@/lib/ai";
import { allowedProductNames, normalizeProductName } from "@/data/allowed-products";

describe("validateAiSuggestions", () => {
  it("aceita resposta quando todos os produtos existem na base", () => {
    const raw = {
      suggestions: [{ name: "Arroz", ingredients: ["Arroz"], steps: ["Cozinhe conforme a embalagem."] }],
    };
    expect(validateAiSuggestions(raw)).toHaveLength(1);
  });

  it("rejeita produto inexistente ou fora da base", () => {
    const raw = {
      suggestions: [{ name: "Inválida", ingredients: ["Arroz", "ProdutoQueNaoExiste"], steps: ["Asse."] }],
    };
    expect(validateAiSuggestions(raw)).toBeNull();
  });

  it("não aceita um nome parcial só porque há um produto parecido", () => {
    const onlyBrandedMilk = new Set([normalizeProductName("Leite Integral Marca X 1L")]);
    const raw = {
      suggestions: [{ name: "Leite", ingredients: ["Leite"], steps: ["Sirva."] }],
    };
    expect(validateAiSuggestions(raw, onlyBrandedMilk)).toBeNull();
  });

  it("aceita diferenças de caixa, acento e espaços que não mudam a identidade", () => {
    const raw = {
      suggestions: [{ name: "Arroz", ingredients: ["  ARROZ  "], steps: ["Cozinhe."] }],
    };
    expect(allowedProductNames.has(normalizeProductName("arroz"))).toBe(true);
    expect(validateAiSuggestions(raw)).toHaveLength(1);
  });

  it("rejeita resposta com formato incorreto", () => {
    expect(validateAiSuggestions({ foo: "bar" })).toBeNull();
    expect(validateAiSuggestions(undefined)).toBeNull();
  });
});
