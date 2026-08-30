import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const selected = new Set((process.env.IMPORT_TABLES ?? "").split(",").filter(Boolean).map((value) => value.toUpperCase()));
const files = process.argv.slice(2);
if (!files.length) throw new Error("Indicá los archivos .sql a importar");
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter(Boolean).filter((l) => !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const id = (s) => s.toLowerCase().replace(/[^a-z0-9_]/g, "_");

function tuples(input) {
  const out = []; let i = 0;
  while (i < input.length) {
    while (i < input.length && input[i] !== "(") i++; if (i >= input.length) break;
    i++; let quote = false, values = [], value = "";
    for (; i < input.length; i++) { const c = input[i];
      if (quote) { if (c === "\\") { value += c + (input[++i] ?? ""); continue; } if (c === "'") quote = false; value += c; continue; }
      if (c === "'") { quote = true; value += c; continue; }
      if (c === ",") { values.push(value); value = ""; continue; }
      if (c === ")") { values.push(value); out.push(values); i++; break; }
      value += c;
    }
  } return out;
}
function value(raw) { const v = raw.trim(); if (v === "NULL") return null; if (v.startsWith("'")) return v.slice(1, -1).replace(/\\0/g, "\0").replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\'/g, "'").replace(/\\\\/g, "\\"); return /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v; }
function statements(source) { const out = []; let pos = 0; while ((pos = source.indexOf("INSERT INTO `", pos)) >= 0) { let q = false, end = pos; for (; end < source.length; end++) { const c = source[end]; if (q && c === "\\") { end++; continue; } if (c === "'") q = !q; if (!q && c === ";") break; } out.push(source.slice(pos, end)); pos = end + 1; } return out; }

for (const file of files) {
  for (const stmt of statements(readFileSync(file, "utf8"))) {
    const m = stmt.match(/^INSERT INTO `([^`]+)` \(([^)]+)\) VALUES\s*([\s\S]*)$/); if (!m) continue;
    const [, original, rawCols, rawRows] = m; if (original === "EMPRESA" || (selected.size && !selected.has(original))) continue;
    const cols = rawCols.split(",").map((c) => id(c.replaceAll("`", "").trim()));
    const rows = tuples(rawRows).map((row) => Object.fromEntries(cols.map((c, n) => [c, value(row[n] ?? "NULL")] )));
    if (original === "TA_USUARIOS") {
      for (const row of rows) if (typeof row.usr_pass === "string" && !row.usr_pass.startsWith("$2")) row.usr_pass = await bcrypt.hash(row.usr_pass, 12);
    }
    for (let n = 0; n < rows.length; n += 200) { const { error } = await db.from(id(original)).insert(rows.slice(n, n + 200)); if (error) throw new Error(`${original}: ${error.message}`); }
    console.log(`${original}: ${rows.length} filas`);
  }
}
