export interface Price {
  id: string;
  productId: string;
  store: string;
  priceCents: number;
  // Data da última atualização (AAAA-MM-DD)
  updatedAt: string;
}
