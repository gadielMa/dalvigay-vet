import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 50;

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ dueño?: string; mascota?: string; vet?: string; page?: string }>;
}) {
  const { dueño = "", mascota = "", vet = "", page = "1" } = await searchParams;
  const supabase = createAdminClient();
  const current = Math.max(1, parseInt(page));
  const from = (current - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const hayFiltro = dueño || mascota || vet;

  // IDs de clientes que cumplen el filtro de mascota
  let idsPorMascota: number[] | null = null;
  if (mascota) {
    const { data } = await supabase
      .from("pacientes")
      .select("pac_cliente")
      .ilike("pac_nombre", `%${mascota}%`);
    idsPorMascota = [...new Set((data ?? []).map((r) => Number(r.pac_cliente)))];
  }

  // IDs de clientes que cumplen el filtro de veterinario
  let idsPorVet: number[] | null = null;
  if (vet) {
    const [{ data: dHc }, { data: dVac }] = await Promise.all([
      supabase.from("hcren").select("hcr_hcc_idpaciente").ilike("hcr_dr", `%${vet}%`),
      supabase.from("vacunas").select("vac_idcliente").ilike("vac_dr", `%${vet}%`),
    ]);
    const pacIds = [...new Set((dHc ?? []).map((r) => Number(r.hcr_hcc_idpaciente)))];
    let cliIdsViaHc: number[] = [];
    if (pacIds.length > 0) {
      const { data: pacs } = await supabase
        .from("pacientes")
        .select("pac_cliente")
        .in("pac_id", pacIds.slice(0, 500));
      cliIdsViaHc = (pacs ?? []).map((r) => Number(r.pac_cliente));
    }
    const cliIdsViaVac = (dVac ?? []).map((r) => Number(r.vac_idcliente));
    idsPorVet = [...new Set([...cliIdsViaHc, ...cliIdsViaVac])];
  }

  // Intersección de los filtros de IDs
  let idsFinales: number[] | null = null;
  if (idsPorMascota !== null && idsPorVet !== null) {
    const setVet = new Set(idsPorVet);
    idsFinales = idsPorMascota.filter((id) => setVet.has(id));
  } else {
    idsFinales = idsPorMascota ?? idsPorVet;
  }

  // Query principal
  let query = supabase
    .from("clientes")
    .select("cli_id, cli_nombre, cli_apellido, cli_celu, cli_mail, cli_tel1", { count: "exact" })
    .order("cli_apellido")
    .range(from, to);

  if (dueño) {
    query = query.or(`cli_apellido.ilike.%${dueño}%,cli_nombre.ilike.%${dueño}%`);
  }
  if (idsFinales !== null) {
    if (idsFinales.length === 0) {
      query = query.eq("cli_id", -1); // sin resultados
    } else {
      query = query.in("cli_id", idsFinales.slice(0, 500));
    }
  }

  const { data: clientes, count } = await query;
  const total = count ?? 0;
  const pages = Math.ceil(total / PAGE_SIZE);
  const paginaHref = (p: number) =>
    `?dueño=${dueño}&mascota=${mascota}&vet=${vet}&page=${p}`;

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-800">Clientes</h1>
        <p className="text-xs text-slate-500">{total.toLocaleString("es-AR")} registros</p>
      </div>

      <form method="GET" className="mb-4 grid grid-cols-3 gap-2 max-w-2xl">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">👤 Dueño</label>
          <Input name="dueño" defaultValue={dueño} placeholder="Nombre o apellido…" className="text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">🐾 Mascota</label>
          <Input name="mascota" defaultValue={mascota} placeholder="Nombre de la mascota…" className="text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">🩺 Veterinario</label>
          <Input name="vet" defaultValue={vet} placeholder="Nombre del veterinario…" className="text-sm" />
        </div>
        <div className="col-span-3 flex gap-2">
          <Button type="submit" size="sm">Buscar</Button>
          {hayFiltro && (
            <Link href="/dashboard/clientes">
              <Button variant="outline" size="sm">Limpiar</Button>
            </Link>
          )}
        </div>
      </form>

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

      {pages > 1 && (
        <div className="flex items-center gap-2 mt-4 text-sm">
          {current > 1 && (
            <Link href={paginaHref(current - 1)}>
              <Button variant="outline" size="sm">← Anterior</Button>
            </Link>
          )}
          <span className="text-slate-500">Página {current} de {pages}</span>
          {current < pages && (
            <Link href={paginaHref(current + 1)}>
              <Button variant="outline" size="sm">Siguiente →</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
