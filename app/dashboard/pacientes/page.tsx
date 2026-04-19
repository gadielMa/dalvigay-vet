import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 50;

const ESPECIE: Record<string, string> = { C: "🐶", F: "🐱", AVE: "🐦" };

export default async function PacientesPage({
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
    .from("pacientes")
    .select(
      "pac_id, pac_nombre, pac_raz_nombre, pac_raz_siglas, pac_sexo, pac_cliente, pac_fecha_nac, pac_microchip",
      { count: "exact" },
    )
    .order("pac_nombre")
    .range(from, to);

  if (q) {
    query = query.or(
      `pac_nombre.ilike.%${q}%,pac_raz_nombre.ilike.%${q}%,pac_microchip.ilike.%${q}%`,
    );
  }

  const { data: pacientes, count } = await query;
  const total = count ?? 0;
  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Pacientes</h1>
          <p className="text-xs text-slate-500">{total.toLocaleString("es-AR")} registros</p>
        </div>
      </div>

      <form method="GET" className="mb-4 flex gap-2 max-w-md">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, raza o microchip…"
          className="text-sm"
        />
        <Button type="submit" size="sm">Buscar</Button>
        {q && (
          <Link href="/dashboard/pacientes">
            <Button variant="outline" size="sm">Limpiar</Button>
          </Link>
        )}
      </form>

      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Nombre</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Especie</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Raza</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Sexo</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Nacimiento</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Microchip</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Cliente ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pacientes?.map((p) => (
              <tr key={p.pac_id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2.5 font-medium text-slate-800">
                  <Link href={`/dashboard/pacientes/${p.pac_id}`} className="hover:text-blue-600 hover:underline">
                    {p.pac_nombre?.trim()}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-lg">
                  {ESPECIE[p.pac_raz_siglas?.trim()] ?? "🐾"}
                </td>
                <td className="px-4 py-2.5 text-slate-600">{p.pac_raz_nombre?.trim()}</td>
                <td className="px-4 py-2.5 text-slate-600">
                  {p.pac_sexo === "M" ? "♂ Macho" : p.pac_sexo === "H" ? "♀ Hembra" : p.pac_sexo?.trim() || "—"}
                </td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">
                  {p.pac_fecha_nac?.trim() || "—"}
                </td>
                <td className="px-4 py-2.5 text-slate-500 text-xs font-mono">
                  {p.pac_microchip?.trim() || "—"}
                </td>
                <td className="px-4 py-2.5 text-slate-400 text-xs">{p.pac_cliente}</td>
              </tr>
            ))}
            {(!pacientes || pacientes.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center gap-2 mt-4 text-sm">
          {current > 1 && (
            <Link href={`?q=${q}&page=${current - 1}`}>
              <Button variant="outline" size="sm">← Anterior</Button>
            </Link>
          )}
          <span className="text-slate-500">Página {current} de {pages}</span>
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
