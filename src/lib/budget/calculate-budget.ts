// Calcula o subtotal de um item (embalagens x preço da embalagem)
export function calculateSubtotal(packages: number, unitPriceCents: number): number {
  return packages * unitPriceCents;
}

// Soma os subtotais de todos os itens
export function calculateTotal(items: { subtotalCents: number }[]): number {
  return items.reduce((total, item) => total + item.subtotalCents, 0);
}
