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

  // El estudio tiene sólo el ID de la mascota. Así también se puede buscar
  // por nombre de mascota o por su dueño desde esta pantalla.
  const term = q.replace(/[,%()]/g, " ").trim();
  let patientIdsBySearch: number[] = [];
  if (term) {
    const [{ data: matchingPets }, { data: matchingOwners }] = await Promise.all([
      supabase.from("pacientes").select("pac_id").ilike("pac_nombre", `%${term}%`).limit(500),
      supabase.from("clientes").select("cli_id").or(`cli_nombre.ilike.%${term}%,cli_apellido.ilike.%${term}%,cli_razsoc.ilike.%${term}%`).limit(500),
    ]);
    const ownerIds = (matchingOwners ?? []).map((owner) => Number(owner.cli_id)).filter(Number.isFinite);
    const { data: petsOfOwners } = ownerIds.length
      ? await supabase.from("pacientes").select("pac_id").in("pac_cliente", ownerIds)
      : { data: [] as { pac_id: number }[] };
    patientIdsBySearch = [...new Set([...(matchingPets ?? []), ...(petsOfOwners ?? [])].map((pet) => Number(pet.pac_id)).filter(Number.isFinite))];
  }

  let query = supabase
    .from("rayos")
    .select("*", { count: "exact" })
    .order("ray_fvisita", { ascending: false })
    .range(from, to);

  if (term) {
    const filters = [`ray_dr.ilike.%${term}%`, `ray_estudio.ilike.%${term}%`];
    if (patientIdsBySearch.length) filters.push(`ray_idpaciente.in.(${patientIdsBySearch.slice(0, 500).join(",")})`);
    query = query.or(filters.join(","));
  }

  const { data: rayos, count } = await query;
  const patientIds = [...new Set((rayos ?? []).map((ray) => Number(ray.ray_idpaciente)).filter(Number.isFinite))];
  const { data: pacientes } = patientIds.length
    ? await supabase.from("pacientes").select("pac_id,pac_nombre,pac_raz_siglas").in("pac_id", patientIds)
    : { data: [] as { pac_id: number; pac_nombre?: string | null; pac_raz_siglas?: string | null }[] };
  const patientNames = Object.fromEntries((pacientes ?? []).map((patient) => [String(patient.pac_id), `${patient.pac_raz_siglas?.trim() === "F" ? "🐱" : "🐾"} ${patient.pac_nombre?.trim() || `Paciente #${patient.pac_id}`}`]));
  const total = count ?? 0;
  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-800">Rayos X</h1>
        <p className="text-xs text-slate-500">{total.toLocaleString("es-AR")} registros</p>
      </div>

      <form method="GET" className="mb-4 flex gap-2 max-w-md">
        <Input name="q" defaultValue={q} placeholder="Mascota, dueño, médico o estudio…" className="text-sm" />
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
                  <Link href={`/dashboard/pacientes/${r.ray_idpaciente}`} className="text-blue-700 hover:underline">{patientNames[String(r.ray_idpaciente)] || `Paciente #${r.ray_idpaciente}`}</Link> · {r.ray_estudio?.trim() || "Rayos X"}
                </div>
                <div className="text-xs text-slate-500">
                  {r.ray_fvisita?.trim() || "Sin fecha"} · Dr/a: {r.ray_dr?.trim() || "—"}
                </div>
              </div>
            </div>
            {(() => { const candidate = [r.ray_foto, r.ray_imagen, r.ray_archivo, r.ray_adjunto].find((value) => typeof value === "string" && value.trim() && value.trim() !== "0"); return candidate ? <a href={candidate.trim()} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-medium text-blue-700 hover:underline">🖼️ Ver imagen / archivo</a> : null; })()}
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
