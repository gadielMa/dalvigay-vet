import { readFileSync } from "node:fs";

const dumps = process.argv.slice(2);
if (!dumps.length) {
  console.error("Uso: node scripts/generar-esquema-legado.mjs archivo1.sql ...");
  process.exit(1);
}

const excluded = new Set(["EMPRESA"]); // contiene una contraseña histórica de correo
const identifier = (value) => value.toLowerCase().replace(/[^a-z0-9_]/g, "_");
const sqlType = (type) => {
  const value = type.toLowerCase();
  if (/^(tinyint|smallint|mediumint|int|bigint)/.test(value)) return "bigint";
  if (/^(double|float|decimal)/.test(value)) return "numeric";
  return "text";
};

const tables = new Map();
for (const dump of dumps) {
  const source = readFileSync(dump, "utf8");
  for (const match of source.matchAll(/CREATE TABLE `([^`]+)` \(\n([\s\S]*?)\n\) ENGINE/g)) {
    const [, originalName, body] = match;
    if (excluded.has(originalName)) continue;
    const columns = [...body.matchAll(/^\s*`([^`]+)`\s+([^\s,]+)/gm)]
      .map(([, name, type]) => `  ${identifier(name)} ${sqlType(type)}`);
    tables.set(identifier(originalName), columns);
  }
}

console.log("-- Esquema generado desde respaldos MySQL. No incluye datos ni credenciales.");
console.log("create schema if not exists public;");
for (const [table, columns] of tables) {
  console.log(`create table if not exists public.${table} (\n${columns.join(",\n")}\n);`);
  console.log(`alter table public.${table} enable row level security;`);
}
