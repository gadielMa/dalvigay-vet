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
  let nuevasQuery = supabase.from("consultas_nuevas").select("*").order("fecha", { ascending: false }).limit(100);
  if (term) {
    const filters = [`titulo.ilike.%${term}%`, `profesional.ilike.%${term}%`, `detalle.ilike.%${term}%`];
    if (Number.isInteger(Number(term))) filters.push(`paciente_id.eq.${Number(term)}`);
    if (patientIdsBySearch.length) filters.push(`paciente_id.in.(${patientIdsBySearch.slice(0, 500).join(",")})`);
    nuevasQuery = nuevasQuery.or(filters.join(","));
  }
  const { data: consultasNuevas } = await nuevasQuery;
  const patientIds = [...new Set([
    ...(registros ?? []).map((record) => Number(record.hcr_hcc_idpaciente)),
    ...(consultasNuevas ?? []).map((record) => Number(record.paciente_id)),
  ].filter(Number.isFinite))];
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
  // La historia combina registros históricos (hcren) y consultas nuevas.
  // Antes el contador sólo tomaba hcren y mostraba 0 aunque hubiera consultas.
  const total = (count ?? 0) + (consultasNuevas?.length ?? 0);
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
            {r.hcr_detalle?.trim() && <details className="mt-2 border-t pt-2"><summary className="cursor-pointer text-xs font-medium text-blue-700">Ver detalle completo</summary><div className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-600" dangerouslySetInnerHTML={{ __html: r.hcr_detalle.trim().replace(/<script[^>]*>.*?<\/script>/gi, "") }} /></details>}
          </div>
        ))}
        {(!registros || registros.length === 0) && (
          <div className="bg-white rounded-xl border p-8 text-center text-slate-400">
            Sin resultados
          </div>
        )}
      </div>

      {consultasNuevas && consultasNuevas.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-base font-semibold text-slate-800">🩺 Consultas nuevas ({consultasNuevas.length})</h2>
          <div className="space-y-3">
            {consultasNuevas.map((consulta) => {
              const patientId = String(consulta.paciente_id ?? "");
              return <article key={consulta.id} className="rounded-xl border bg-white p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-2"><div><Link href={`/dashboard/pacientes/${patientId}`} className="font-medium text-slate-800 hover:text-blue-700 hover:underline">🩺 {patientNames[patientId] || `Paciente #${patientId}`}</Link><p className="mt-1 text-xs text-slate-500">{String(consulta.fecha ?? "").trim() || "Sin fecha"} · {String(consulta.titulo ?? "Consulta").trim()} · Dr/a: {String(consulta.profesional ?? "—").trim()}</p></div><span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">Nueva</span></div>{String(consulta.detalle ?? "").trim() && <p className="mt-3 border-t pt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{String(consulta.detalle).trim()}</p>}{String(consulta.tratamiento ?? "").trim() && <p className="mt-2 text-sm text-slate-600"><b>Indicaciones:</b> {String(consulta.tratamiento).trim()}</p>}</article>;
            })}
          </div>
        </section>
      )}

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
