import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 50;

export default async function VacunasPage({
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
    .from("vacunas")
    .select(
      "vac_id, vac_idpaciente, vac_idcliente, vac_dr, vac_fvisita, vac_fproxima, vac_marca, vac_clase, vac_pac_raz_esp, vac_volvio",
      { count: "exact" },
    )
    .order("vac_fvisita", { ascending: false })
    .range(from, to);

  if (q) {
    query = query.or(
      `vac_marca.ilike.%${q}%,vac_clase.ilike.%${q}%,vac_dr.ilike.%${q}%`,
    );
  }

  const { data: vacunas, count } = await query;
  const total = count ?? 0;
  const pages = Math.ceil(total / PAGE_SIZE);

  const ESPECIE: Record<string, string> = { C: "🐶", F: "🐱", AVE: "🐦" };

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-800">Vacunas</h1>
        <p className="text-xs text-slate-500">{total.toLocaleString("es-AR")} registros</p>
      </div>

      <form method="GET" className="mb-4 flex gap-2 max-w-md">
        <Input name="q" defaultValue={q} placeholder="Buscar por marca, clase o médico…" className="text-sm" />
        <Button type="submit" size="sm">Buscar</Button>
        {q && <Link href="/dashboard/vacunas"><Button variant="outline" size="sm">Limpiar</Button></Link>}
      </form>

      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Paciente</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Especie</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Marca</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Clase</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Fecha visita</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Próxima</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Médico</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Volvió</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vacunas?.map((v) => (
              <tr key={v.vac_id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2.5 text-slate-600 text-xs">#{v.vac_idpaciente}</td>
                <td className="px-4 py-2.5 text-lg">{ESPECIE[v.vac_pac_raz_esp?.trim()] ?? "🐾"}</td>
                <td className="px-4 py-2.5 font-medium text-slate-800">{v.vac_marca?.trim() || "—"}</td>
                <td className="px-4 py-2.5 text-slate-600">{v.vac_clase?.trim() || "—"}</td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{v.vac_fvisita?.trim() || "—"}</td>
                <td className="px-4 py-2.5 text-xs">
                  {v.vac_fproxima?.trim() ? (
                    <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                      {v.vac_fproxima.trim()}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{v.vac_dr?.trim() || "—"}</td>
                <td className="px-4 py-2.5 text-xs">
                  {v.vac_volvio === "1"
                    ? <span className="text-green-600">✓ Sí</span>
                    : <span className="text-slate-400">No</span>}
                </td>
              </tr>
            ))}
            {(!vacunas || vacunas.length === 0) && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center gap-2 mt-4 text-sm">
          {current > 1 && <Link href={`?q=${q}&page=${current - 1}`}><Button variant="outline" size="sm">← Anterior</Button></Link>}
          <span className="text-slate-500">Página {current} de {pages}</span>
          {current < pages && <Link href={`?q=${q}&page=${current + 1}`}><Button variant="outline" size="sm">Siguiente →</Button></Link>}
        </div>
      )}
    </div>
  );
}
