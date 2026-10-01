// Converte reais para centavos (inteiro)
export function reaisToCents(reais: number): number {
  return Math.round(reais * 100);
}

// Converte centavos para reais com 2 casas
export function centsToReais(cents: number): number {
  return Math.round(cents) / 100;
}

// Formata centavos como moeda brasileira
export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    centsToReais(cents),
  );
}
