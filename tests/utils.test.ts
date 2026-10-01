import { describe, expect, it } from "vitest";
import { daysBetween, isValidISODate, todayISO } from "@/lib/date";
import { centsToReais, formatBRL, reaisToCents } from "@/lib/money";

describe("money", () => {
  it("converte reais para centavos sem erro de ponto flutuante", () => {
    expect(reaisToCents(19.9)).toBe(1_990);
    expect(reaisToCents(0.1 + 0.2)).toBe(30);
  });

  it("converte centavos para reais", () => {
    expect(centsToReais(1_234)).toBe(12.34);
  });

  it("formata como moeda brasileira", () => {
    expect(formatBRL(123_456).replace(/\s/g, " ")).toBe("R$ 1.234,56");
  });
});

describe("date", () => {
  it("aceita datas reais e rejeita inexistentes", () => {
    expect(isValidISODate("2026-02-28")).toBe(true);
    expect(isValidISODate("2026-02-30")).toBe(false);
    expect(isValidISODate("30/09/2026")).toBe(false);
  });

  it("calcula a diferença em dias", () => {
    expect(daysBetween("2026-09-30", "2026-10-02")).toBe(2);
    expect(daysBetween("2026-09-30", "2026-09-28")).toBe(-2);
    expect(daysBetween("2026-09-30", "2026-09-30")).toBe(0);
  });

  it("devolve a data de hoje no formato AAAA-MM-DD", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
