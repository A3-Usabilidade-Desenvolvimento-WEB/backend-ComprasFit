import fs from "node:fs";
import path from "node:path";

export interface AllowedProduct {
  category: string;
  name: string;
}

// Normalization deliberately only removes presentation differences.  It is not
// a fuzzy match: two different product descriptions remain different products.
export function normalizeProductName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim()
    .replace(/\s+/g, " ");
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        field += character;
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      fields.push(field);
      field = "";
    } else {
      field += character;
    }
  }

  fields.push(field);
  return fields;
}

function loadAllowedProducts(): AllowedProduct[] {
  const csvPath = path.join(process.cwd(), "src", "data", "produtos_alimenticios_categorizados.csv");
  const [, ...rows] = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/);
  const seen = new Set<string>();

  return rows.flatMap((row) => {
    if (!row.trim()) return [];
    const [category, name] = parseCsvLine(row);
    const normalizedName = name ? normalizeProductName(name) : "";
    if (!category || !name || !normalizedName || seen.has(normalizedName)) return [];
    seen.add(normalizedName);
    return [{ category: category.trim(), name: name.trim() }];
  });
}

// Loaded once when the server starts; requests only consult this in-memory index.
export const allowedProducts = loadAllowedProducts();
export const allowedProductNames = new Set(allowedProducts.map((product) => normalizeProductName(product.name)));

export function isAllowedProductName(name: string): boolean {
  return allowedProductNames.has(normalizeProductName(name));
}

export function findAllowedProduct(name: string): AllowedProduct | undefined {
  const normalizedName = normalizeProductName(name);
  return allowedProducts.find((product) => normalizeProductName(product.name) === normalizedName);
}
