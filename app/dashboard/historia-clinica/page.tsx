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
    .from("hcren")
    .select(
      "hcr_id, hcr_hcc_idpaciente, hcr_fecha_hc, hcr_titulo, hcr_peso, hcr_temp, hcr_detalle, hcr_dr",
      { count: "exact" },
    )
    .order("hcr_fecha_hc", { ascending: false })
    .range(from, to);

  if (term) {
    const filters = [`hcr_dr.ilike.%${term}%`, `hcr_titulo.ilike.%${term}%`];
    if (Number.isInteger(Number(term))) filters.push(`hcr_hcc_idpaciente.eq.${Number(term)}`);
    if (patientIdsBySearch.length) filters.push(`hcr_hcc_idpaciente.in.(${patientIdsBySearch.slice(0, 500).join(",")})`);
    query = query.or(filters.join(","));
  }

  const { data: registros, count } = await query;
  const patientIds = [...new Set((registros ?? []).map((record) => Number(record.hcr_hcc_idpaciente)).filter(Number.isFinite))];
  const { data: pacientes } = patientIds.length
    ? await supabase.from("pacientes").select("pac_id,pac_nombre,pac_raz_siglas,pac_cliente").in("pac_id", patientIds)
    : { data: [] as { pac_id: number; pac_nombre?: string | null; pac_raz_siglas?: string | null; pac_cliente?: number | null }[] };
  const patientNames = Object.fromEntries((pacientes ?? []).map((patient) => [String(patient.pac_id), `${patient.pac_raz_siglas?.trim() === "F" ? "🐱" : "🐾"} ${patient.pac_nombre?.trim() || `Paciente #${patient.pac_id}`}`]));
  const ownerIds = [...new Set((pacientes ?? []).map((patient) => Number(patient.pac_cliente)).filter(Number.isFinite))];
  const { data: owners } = ownerIds.length
    ? await supabase.from("clientes").select("cli_id,cli_nombre,cli_apellido").in("cli_id", ownerIds)
    : { data: [] as { cli_id: number; cli_nombre?: string | null; cli_apellido?: string | null }[] };
  const ownerNames = Object.fromEntries((owners ?? []).map((owner) => [String(owner.cli_id), `${owner.cli_apellido?.trim() || ""}, ${owner.cli_nombre?.trim() || ""}`.replace(/^, |, $/g, "") || `Cliente #${owner.cli_id}`]));
  const ownerForPatient = (patientId: string | number | null) => (pacientes ?? []).find((patient) => Number(patient.pac_id) === Number(patientId))?.pac_cliente;
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
          placeholder="Mascota, dueño, médico, título o ID…"
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
                    <Link href={`/dashboard/pacientes/${r.hcr_hcc_idpaciente}`} className="hover:text-blue-700 hover:underline">{patientNames[String(r.hcr_hcc_idpaciente)] || `Paciente #${r.hcr_hcc_idpaciente}`}</Link>
                    {r.hcr_titulo?.trim() ? ` · ${r.hcr_titulo.trim()}` : ""}
                  </div>
                  <div className="text-xs text-slate-500">
                    {r.hcr_fecha_hc?.trim() || "Sin fecha"} · Dr/a: {r.hcr_dr?.trim() || "—"}
                  </div>
                  {ownerForPatient(r.hcr_hcc_idpaciente) && <Link href={`/dashboard/clientes/${ownerForPatient(r.hcr_hcc_idpaciente)}`} className="mt-1 block text-xs text-blue-700 hover:underline">👤 {ownerNames[String(ownerForPatient(r.hcr_hcc_idpaciente))] || "Ver dueño"}</Link>}
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
