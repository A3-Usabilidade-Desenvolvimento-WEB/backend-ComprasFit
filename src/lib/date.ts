// Devolve a data de hoje (AAAA-MM-DD) no fuso de São Paulo
export function todayISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

// Verifica se o texto é uma data AAAA-MM-DD existente
export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// Calcula quantos dias faltam de uma data até outra (negativo se já passou)
export function daysBetween(from: string, to: string): number {
  const msPerDay = 86_400_000;
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / msPerDay);
}
