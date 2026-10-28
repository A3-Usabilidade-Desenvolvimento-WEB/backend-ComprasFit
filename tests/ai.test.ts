import { describe, expect, it } from "vitest";
import { DeterministicSuggestionProvider, validateAiSuggestions, validatedFallbackSuggestions } from "@/lib/ai";
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

describe("DeterministicSuggestionProvider", () => {
  it("não usa chave de LLM e só sugere com ingredientes suficientes", async () => {
    delete process.env.LLM_API_KEY;
    const suggestions = await new DeterministicSuggestionProvider().suggest(["Arroz", "Feijão Carioca Camil 1Kg"]);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].ingredients).toEqual(["Arroz", "Feijão Carioca Camil 1Kg"]);
  });

  it("retorna vazio quando não há ingredientes autorizados suficientes", async () => {
    await expect(new DeterministicSuggestionProvider().suggest(["Arroz"])).resolves.toEqual([]);
  });
});

describe("fallback", () => {
  it("rejeita o fallback inteiro quando um ingrediente não pertence ao catálogo", () => {
    expect(validatedFallbackSuggestions([
      { name: "Inválida", ingredients: ["ProdutoQueNaoExiste"], steps: ["Cozinhe."] },
    ])).toEqual([]);
  });
});
