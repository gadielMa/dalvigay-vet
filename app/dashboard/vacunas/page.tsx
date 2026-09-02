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
  const term = q.replace(/[,%()]/g, " ").trim();
  let patientIdsBySearch: number[] = [];
  let clientIdsBySearch: number[] = [];
  if (term) {
    const [{ data: pets }, { data: owners }] = await Promise.all([
      supabase.from("pacientes").select("pac_id").ilike("pac_nombre", `%${term}%`).limit(500),
      supabase.from("clientes").select("cli_id").or(`cli_nombre.ilike.%${term}%,cli_apellido.ilike.%${term}%,cli_razsoc.ilike.%${term}%`).limit(500),
    ]);
    patientIdsBySearch = (pets ?? []).map((pet) => Number(pet.pac_id)).filter(Number.isFinite);
    clientIdsBySearch = (owners ?? []).map((owner) => Number(owner.cli_id)).filter(Number.isFinite);
  }

  let query = supabase
    .from("vacunas")
    .select(
      "vac_id, vac_idpaciente, vac_idcliente, vac_dr, vac_fvisita, vac_fproxima, vac_fproxima_seg, vac_marca, vac_clase, vac_nserie, vac_precio, vac_cant, vac_tot, vac_facturar, vac_resaltado, vac_incluir, vac_pac_raz_esp, vac_volvio",
      { count: "exact" },
    )
    .order("vac_fvisita", { ascending: false })
    .range(from, to);

  if (term) {
    const filters = [`vac_marca.ilike.%${term}%`, `vac_clase.ilike.%${term}%`, `vac_dr.ilike.%${term}%`];
    if (patientIdsBySearch.length) filters.push(`vac_idpaciente.in.(${patientIdsBySearch.slice(0, 500).join(",")})`);
    if (clientIdsBySearch.length) filters.push(`vac_idcliente.in.(${clientIdsBySearch.slice(0, 500).join(",")})`);
    query = query.or(filters.join(","));
  }

  const { data: vacunas, count } = await query;
  const patientIds = [...new Set((vacunas ?? []).map((v) => Number(v.vac_idpaciente)).filter(Number.isFinite))];
  const { data: pacientes } = patientIds.length
    ? await supabase.from("pacientes").select("pac_id, pac_nombre, pac_cliente").in("pac_id", patientIds)
    : { data: [] as { pac_id: number; pac_nombre?: string | null; pac_cliente?: number | null }[] };
  const patientNames = Object.fromEntries((pacientes ?? []).map((p) => [String(p.pac_id), p.pac_nombre?.trim() || `Paciente #${p.pac_id}`]));
  const ownerIds = [...new Set((vacunas ?? []).map((v) => Number(v.vac_idcliente)).concat((pacientes ?? []).map((patient) => Number(patient.pac_cliente))).filter(Number.isFinite))];
  const { data: owners } = ownerIds.length
    ? await supabase.from("clientes").select("cli_id,cli_nombre,cli_apellido").in("cli_id", ownerIds)
    : { data: [] as { cli_id: number; cli_nombre?: string | null; cli_apellido?: string | null }[] };
  const ownerNames = Object.fromEntries((owners ?? []).map((owner) => [String(owner.cli_id), `${owner.cli_apellido?.trim() || ""}, ${owner.cli_nombre?.trim() || ""}`.replace(/^, |, $/g, "") || `Cliente #${owner.cli_id}`]));
  const ownerFor = (v: { vac_idcliente?: string | number | null; vac_idpaciente?: string | number | null }) => Number(v.vac_idcliente) || Number((pacientes ?? []).find((patient) => Number(patient.pac_id) === Number(v.vac_idpaciente))?.pac_cliente);
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
        <Input name="q" defaultValue={q} placeholder="Mascota, dueño, marca, clase o médico…" className="text-sm" />
        <Button type="submit" size="sm">Buscar</Button>
        {q && <Link href="/dashboard/vacunas"><Button variant="outline" size="sm">Limpiar</Button></Link>}
      </form>

      <div className="space-y-2 md:hidden">
        {vacunas?.map((v) => (
          <Link key={v.vac_id} href={`/dashboard/pacientes/${v.vac_idpaciente}`} className="block rounded-xl border bg-white p-4 shadow-sm active:bg-slate-50">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-slate-800">{ESPECIE[v.vac_pac_raz_esp?.trim()] ?? "🐾"} {patientNames[String(v.vac_idpaciente)] || `Paciente #${v.vac_idpaciente}`}</p><p className="mt-1 truncate text-sm text-slate-600">{v.vac_marca?.trim() || "Vacuna"}{v.vac_clase?.trim() ? ` · ${v.vac_clase.trim()}` : ""}</p></div><span className="shrink-0 text-xs text-blue-700">Ver ficha →</span></div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500"><span>Visita: {v.vac_fvisita?.trim() || "—"}</span><span>Próxima: {v.vac_fproxima?.trim() || "—"}</span><span>Serie: {v.vac_nserie?.trim() || "—"}</span><span>Total: ${Number(v.vac_tot || 0).toLocaleString("es-AR")}</span><span className="col-span-2 truncate">Dueño: {ownerNames[String(ownerFor(v))] || "—"}</span></div>
          </Link>
        ))}
        {(!vacunas || vacunas.length === 0) && <p className="rounded-xl border bg-white p-8 text-center text-slate-400">Sin resultados</p>}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border bg-white shadow-sm md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Paciente</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Dueño</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Especie</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Marca</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Clase</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Fecha visita</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Próxima</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Serie</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Importe</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Factura</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Estado</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Médico</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Volvió</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vacunas?.map((v) => (
              <tr key={v.vac_id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2.5 text-xs"><Link href={`/dashboard/pacientes/${v.vac_idpaciente}`} className="text-blue-700 hover:underline">🐾 {patientNames[String(v.vac_idpaciente)] || `#${v.vac_idpaciente}`}</Link></td>
                <td className="px-4 py-2.5 text-xs"><Link href={`/dashboard/clientes/${ownerFor(v)}`} className="text-blue-700 hover:underline">{ownerNames[String(ownerFor(v))] || "—"}</Link></td>
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
                <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{v.vac_nserie?.trim() || "—"}</td>
                <td className="px-4 py-2.5 text-xs text-slate-600">${Number(v.vac_tot || 0).toLocaleString("es-AR")} <span className="text-slate-400">({v.vac_cant || "0"} × ${v.vac_precio || "0"})</span></td>
                <td className="px-4 py-2.5 text-xs">{v.vac_facturar === "1" ? <span className="text-green-700">A facturar</span> : <span className="text-slate-400">No</span>}</td>
                <td className="px-4 py-2.5 text-xs">{v.vac_resaltado === "1" && <span className="mr-1 rounded bg-amber-100 px-1 text-amber-800">Destacada</span>}{v.vac_incluir === "1" ? <span className="text-green-700">Incluida</span> : <span className="text-slate-400">No incluida</span>}</td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{v.vac_dr?.trim() || "—"}</td>
                <td className="px-4 py-2.5 text-xs">
                  {v.vac_volvio === "1"
                    ? <span className="text-green-600">✓ Sí</span>
                    : <span className="text-slate-400">No</span>}
                </td>
              </tr>
            ))}
            {(!vacunas || vacunas.length === 0) && (
              <tr><td colSpan={13} className="px-4 py-8 text-center text-slate-400">Sin resultados</td></tr>
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
