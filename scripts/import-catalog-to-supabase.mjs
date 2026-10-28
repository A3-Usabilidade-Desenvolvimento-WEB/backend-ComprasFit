import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !serviceRoleKey) {
  throw new Error("Defina SUPABASE_URL e SUPABASE_SECRET_KEY somente no ambiente do servidor.");
}

function parseCsvLine(line) {
  const fields = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        field += character;
        index += 1;
      } else quoted = !quoted;
    } else if (character === "," && !quoted) {
      fields.push(field);
      field = "";
    } else field += character;
  }
  fields.push(field);
  return fields;
}

const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim().replace(/\s+/g, " ");
const stableId = (prefix, value) => `${prefix}_${createHash("sha256").update(normalize(value)).digest("hex").slice(0, 24)}`;
const parsedProducts = fs.readFileSync(path.join(process.cwd(), "src/data/produtos_alimenticios_categorizados.csv"), "utf8")
  .replace(/^\uFEFF/, "").trim().split(/\r?\n/).slice(1)
  .map(parseCsvLine).map(([category, name]) => ({ category: category.trim(), name: name.trim() }));
const categories = [...new Set(parsedProducts.map((product) => product.category))]
  .map((name) => ({ id: stableId("cat", name), name }));
const categoryIds = new Map(categories.map((category) => [category.name, category.id]));
const products = parsedProducts.map(({ category, name }) => ({
  id: stableId("prd", name),
  category_id: categoryIds.get(category),
  name,
  normalized_name: normalize(name),
  name_truncated: name.endsWith("..."),
  review_category: ["Alimentos para animais", "Snacks, salgadinhos e pipoca", "Suplementos e nutrição esportiva", "Biscoitos e bolachas", "Condimentos, molhos e temperos", "Frutas"].includes(category),
}));

async function upsert(table, rows, conflict) {
  const response = await fetch(`${url}/rest/v1/${table}?on_conflict=${conflict}`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
      prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!response.ok) throw new Error(`Falha ao importar ${table}: ${response.status} ${await response.text()}`);
}

await upsert("categories", categories, "name");
await upsert("products", products, "normalized_name");
console.log(`${categories.length} categorias e ${products.length} produtos enviados sem duplicação por normalized_name.`);
