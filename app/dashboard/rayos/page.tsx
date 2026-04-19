import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 40;

export default async function RayosPage({
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
    .from("rayos")
    .select("ray_id, ray_idpaciente, ray_fvisita, ray_dr, ray_estudio, ray_diag", { count: "exact" })
    .order("ray_fvisita", { ascending: false })
    .range(from, to);

  if (q) {
    query = query.or(`ray_dr.ilike.%${q}%,ray_estudio.ilike.%${q}%`);
  }

  const { data: rayos, count } = await query;
  const total = count ?? 0;
  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-800">Rayos X</h1>
        <p className="text-xs text-slate-500">{total.toLocaleString("es-AR")} registros</p>
      </div>

      <form method="GET" className="mb-4 flex gap-2 max-w-md">
        <Input name="q" defaultValue={q} placeholder="Buscar por médico o tipo de estudio…" className="text-sm" />
        <Button type="submit" size="sm">Buscar</Button>
        {q && <Link href="/dashboard/rayos"><Button variant="outline" size="sm">Limpiar</Button></Link>}
      </form>

      <div className="space-y-3">
        {rayos?.map((r) => (
          <div key={r.ray_id} className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-2">
              <span className="text-2xl">☢️</span>
              <div>
                <div className="font-medium text-slate-800 text-sm">
                  Paciente #{r.ray_idpaciente} · {r.ray_estudio?.trim() || "Rayos X"}
                </div>
                <div className="text-xs text-slate-500">
                  {r.ray_fvisita?.trim() || "Sin fecha"} · Dr/a: {r.ray_dr?.trim() || "—"}
                </div>
              </div>
            </div>
            {r.ray_diag?.trim() && (
              <p className="text-xs text-slate-600 border-t pt-2 mt-2 leading-relaxed line-clamp-4 whitespace-pre-wrap">
                {r.ray_diag.trim()}
              </p>
            )}
          </div>
        ))}
        {(!rayos || rayos.length === 0) && (
          <div className="bg-white rounded-xl border p-8 text-center text-slate-400">Sin resultados</div>
        )}
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
