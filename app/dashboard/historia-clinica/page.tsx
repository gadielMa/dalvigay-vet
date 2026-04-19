import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 40;

export default async function HistoriaClinicaPage({
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
    .from("hcren")
    .select(
      "hcr_id, hcr_hcc_idpaciente, hcr_fecha_hc, hcr_titulo, hcr_peso, hcr_temp, hcr_detalle, hcr_dr",
      { count: "exact" },
    )
    .order("hcr_fecha_hc", { ascending: false })
    .range(from, to);

  if (q) {
    query = query.or(
      `hcr_hcc_idpaciente.eq.${isNaN(Number(q)) ? 0 : q},hcr_dr.ilike.%${q}%,hcr_titulo.ilike.%${q}%`,
    );
  }

  const { data: registros, count } = await query;
  const total = count ?? 0;
  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-800">Historia Clínica</h1>
        <p className="text-xs text-slate-500">{total.toLocaleString("es-AR")} registros</p>
      </div>

      <form method="GET" className="mb-4 flex gap-2 max-w-md">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por ID paciente, médico o título…"
          className="text-sm"
        />
        <Button type="submit" size="sm">Buscar</Button>
        {q && (
          <Link href="/dashboard/historia-clinica">
            <Button variant="outline" size="sm">Limpiar</Button>
          </Link>
        )}
      </form>

      <div className="space-y-3">
        {registros?.map((r) => (
          <div
            key={r.hcr_id}
            className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <div className="font-medium text-slate-800 text-sm">
                    Paciente #{r.hcr_hcc_idpaciente}
                    {r.hcr_titulo?.trim() ? ` · ${r.hcr_titulo.trim()}` : ""}
                  </div>
                  <div className="text-xs text-slate-500">
                    {r.hcr_fecha_hc?.trim() || "Sin fecha"} · Dr/a: {r.hcr_dr?.trim() || "—"}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 text-xs text-slate-500 shrink-0">
                {r.hcr_peso?.trim() && r.hcr_peso.trim() !== "0" && (
                  <span>⚖️ {r.hcr_peso.trim()} kg</span>
                )}
                {r.hcr_temp?.trim() && r.hcr_temp.trim() !== "0" && (
                  <span>🌡️ {r.hcr_temp.trim()}°C</span>
                )}
              </div>
            </div>
            {r.hcr_detalle?.trim() && (
              <div
                className="text-xs text-slate-600 leading-relaxed border-t pt-2 mt-2 line-clamp-3"
                dangerouslySetInnerHTML={{
                  __html: r.hcr_detalle.trim().replace(/<script[^>]*>.*?<\/script>/gi, ""),
                }}
              />
            )}
          </div>
        ))}
        {(!registros || registros.length === 0) && (
          <div className="bg-white rounded-xl border p-8 text-center text-slate-400">
            Sin resultados
          </div>
        )}
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
