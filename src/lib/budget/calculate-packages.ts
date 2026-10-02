export interface PackageResult {
  packages: number;
  leftover: number;
}

// Calcula quantas embalagens inteiras cobrem a quantidade necessária e quanto sobra
export function calculatePackages(quantityNeeded: number, packageSize: number): PackageResult {
  if (packageSize <= 0) {
    throw new Error("O tamanho da embalagem deve ser maior que zero");
  }
  if (quantityNeeded <= 0) {
    return { packages: 0, leftover: 0 };
  }
  // O desconto de 1e-9 evita arredondar para cima por erro de ponto flutuante
  const packages = Math.ceil(quantityNeeded / packageSize - 1e-9);
  return { packages, leftover: packages * packageSize - quantityNeeded };
}
