export interface FoodExpiration {
  id: string;
  name: string;
  productId?: string;
  // Data de validade da embalagem (AAAA-MM-DD)
  expirationDate: string;
  registeredAt: string;
}
