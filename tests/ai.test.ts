import { describe, expect, it } from "vitest";
import { extractJson, validateAiSuggestions } from "@/lib/ai";

const allowed = ["Arroz branco 5kg", "Feijão carioca 1kg", "Cebola 1kg"];

describe("validateAiSuggestions", () => {
  it("aceita resposta que usa só ingredientes aprovados", () => {
    const raw = {
      suggestions: [{ name: "Arroz com feijão", ingredients: ["arroz", "Feijão"], steps: ["Cozinhe tudo."] }],
    };
    expect(validateAiSuggestions(raw, allowed)).toHaveLength(1);
  });

  it("rejeita resposta com ingrediente fora da lista", () => {
    const raw = {
      suggestions: [{ name: "Picanha", ingredients: ["picanha", "arroz"], steps: ["Asse."] }],
    };
    expect(validateAiSuggestions(raw, allowed)).toBeNull();
  });

  it("rejeita resposta com formato incorreto", () => {
    expect(validateAiSuggestions({ foo: "bar" }, allowed)).toBeNull();
    expect(validateAiSuggestions(undefined, allowed)).toBeNull();
  });
});

describe("extractJson", () => {
  it("lê JSON dentro de cerca de markdown", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("devolve undefined para texto que não é JSON", () => {
    expect(extractJson("sem json aqui")).toBeUndefined();
  });
});
