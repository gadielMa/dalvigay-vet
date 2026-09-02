import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 40;

export default async function EcografiasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page = "1" } = await searchParams;
  const supabase = createAdminClient();
  const current = Math.max(1, parseInt(page));
  const from = (current - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // La ecografía no guarda el nombre de la mascota: primero ubicamos los IDs
  // por mascota o por dueño y luego los sumamos al filtro del estudio.
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
    .from("ecografias")
    .select("eco_id, eco_idpaciente, eco_fecha, eco_dr, eco_estudio, eco_diag", { count: "exact" })
    .order("eco_fecha", { ascending: false })
    .range(from, to);

  if (term) {
    const filters = [`eco_dr.ilike.%${term}%`, `eco_estudio.ilike.%${term}%`];
    if (patientIdsBySearch.length) filters.push(`eco_idpaciente.in.(${patientIdsBySearch.slice(0, 500).join(",")})`);
    query = query.or(filters.join(","));
  }

  const { data: ecos, count } = await query;
  const patientIds = [...new Set((ecos ?? []).map((eco) => Number(eco.eco_idpaciente)).filter(Number.isFinite))];
  const { data: pacientes } = patientIds.length
    ? await supabase.from("pacientes").select("pac_id,pac_nombre,pac_raz_siglas").in("pac_id", patientIds)
    : { data: [] as { pac_id: number; pac_nombre?: string | null; pac_raz_siglas?: string | null }[] };
  const patientNames = Object.fromEntries((pacientes ?? []).map((patient) => [String(patient.pac_id), `${patient.pac_raz_siglas?.trim() === "F" ? "🐱" : "🐾"} ${patient.pac_nombre?.trim() || `Paciente #${patient.pac_id}`}`]));
  const total = count ?? 0;
  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-800">Ecografías</h1>
        <p className="text-xs text-slate-500">{total.toLocaleString("es-AR")} registros</p>
      </div>

      <form method="GET" className="mb-4 flex gap-2 max-w-md">
        <Input name="q" defaultValue={q} placeholder="Mascota, dueño, médico o estudio…" className="text-sm" />
        <Button type="submit" size="sm">Buscar</Button>
        {q && <Link href="/dashboard/ecografias"><Button variant="outline" size="sm">Limpiar</Button></Link>}
      </form>

      <div className="space-y-3">
        {ecos?.map((e) => (
          <div key={e.eco_id} className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-2">
              <span className="text-2xl">🔬</span>
              <div className="flex-1">
                <div className="font-medium text-slate-800 text-sm">
                  <Link href={`/dashboard/pacientes/${e.eco_idpaciente}`} className="text-blue-700 hover:underline">{patientNames[String(e.eco_idpaciente)] || `Paciente #${e.eco_idpaciente}`}</Link> · {e.eco_estudio?.trim() || "Ecografía"}
                </div>
                <div className="text-xs text-slate-500">
                  {e.eco_fecha?.trim() || "Sin fecha"} · Dr/a: {e.eco_dr?.trim() || "—"}
                </div>
              </div>
            </div>
            {e.eco_diag?.trim() && (
              <p className="text-xs text-slate-600 border-t pt-2 mt-2 leading-relaxed line-clamp-4 whitespace-pre-wrap">
                {e.eco_diag.trim()}
              </p>
            )}
          </div>
        ))}
        {(!ecos || ecos.length === 0) && (
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
