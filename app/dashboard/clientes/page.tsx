import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 50;

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page = "1" } = await searchParams;
  const supabase = createAdminClient();
  const current = Math.max(1, parseInt(page));
  const from = (current - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("clientes")
    .select("cli_id, cli_nombre, cli_apellido, cli_celu, cli_mail, cli_tel1", {
      count: "exact",
    })
    .order("cli_apellido")
    .range(from, to);

  if (q) {
    query = query.or(
      `cli_apellido.ilike.%${q}%,cli_nombre.ilike.%${q}%,cli_mail.ilike.%${q}%,cli_celu.ilike.%${q}%`,
    );
  }

  const { data: clientes, count } = await query;
  const total = count ?? 0;
  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Clientes</h1>
          <p className="text-xs text-slate-500">{total.toLocaleString("es-AR")} registros</p>
        </div>
      </div>

      {/* Search */}
      <form method="GET" className="mb-4 flex gap-2 max-w-md">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por apellido, nombre, email o celular…"
          className="text-sm"
        />
        <Button type="submit" size="sm">Buscar</Button>
        {q && (
          <Link href="/dashboard/clientes">
            <Button variant="outline" size="sm">Limpiar</Button>
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">#</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Apellido</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Nombre</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Celular</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Email</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Teléfono</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clientes?.map((c) => (
              <tr key={c.cli_id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2.5 text-slate-400 text-xs">{c.cli_id}</td>
                <td className="px-4 py-2.5 font-medium text-slate-800">{c.cli_apellido?.trim()}</td>
                <td className="px-4 py-2.5 text-slate-700">{c.cli_nombre?.trim()}</td>
                <td className="px-4 py-2.5 text-slate-600">{c.cli_celu?.trim() || "—"}</td>
                <td className="px-4 py-2.5 text-slate-600 text-xs">
                  {c.cli_mail?.trim() && c.cli_mail !== "0" ? c.cli_mail.trim() : "—"}
                </td>
                <td className="px-4 py-2.5 text-slate-600">{c.cli_tel1?.trim() || "—"}</td>
              </tr>
            ))}
            {(!clientes || clientes.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center gap-2 mt-4 text-sm">
          {current > 1 && (
            <Link href={`?q=${q}&page=${current - 1}`}>
              <Button variant="outline" size="sm">← Anterior</Button>
            </Link>
          )}
          <span className="text-slate-500">
            Página {current} de {pages}
          </span>
          {current < pages && (
            <Link href={`?q=${q}&page=${current + 1}`}>
              <Button variant="outline" size="sm">Siguiente →</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
