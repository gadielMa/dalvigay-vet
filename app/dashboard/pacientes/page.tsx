import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 50;
const ESPECIE: Record<string, string> = { C: "🐶", F: "🐱", AVE: "🐦" };

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ mascota?: string; dueño?: string; vet?: string; page?: string }>;
}) {
  const { mascota = "", dueño = "", vet = "", page = "1" } = await searchParams;
  const supabase = createAdminClient();
  const current = Math.max(1, parseInt(page));
  const from = (current - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const hayFiltro = mascota || dueño || vet;

  // IDs de pacientes por dueño
  let idsPorDueño: number[] | null = null;
  if (dueño) {
    const { data } = await supabase
      .from("clientes")
      .select("cli_id")
      .or(`cli_apellido.ilike.%${dueño}%,cli_nombre.ilike.%${dueño}%`);
    const cliIds = (data ?? []).map((r) => r.cli_id);
    if (cliIds.length > 0) {
      const { data: pacs } = await supabase
        .from("pacientes")
        .select("pac_id")
        .in("pac_cliente", cliIds);
      idsPorDueño = (pacs ?? []).map((r) => r.pac_id);
    } else {
      idsPorDueño = [];
    }
  }

  // IDs de pacientes por veterinario
  let idsPorVet: number[] | null = null;
  if (vet) {
    const [{ data: dHc }, { data: dVac }] = await Promise.all([
      supabase.from("hcren").select("hcr_hcc_idpaciente").ilike("hcr_dr", `%${vet}%`),
      supabase.from("vacunas").select("vac_idpaciente").ilike("vac_dr", `%${vet}%`),
    ]);
    const idsHc = (dHc ?? []).map((r) => Number(r.hcr_hcc_idpaciente));
    const idsVac = (dVac ?? []).map((r) => Number(r.vac_idpaciente));
    idsPorVet = [...new Set([...idsHc, ...idsVac])];
  }

  // Intersección
  let idsFinales: number[] | null = null;
  if (idsPorDueño !== null && idsPorVet !== null) {
    const setVet = new Set(idsPorVet);
    idsFinales = idsPorDueño.filter((id) => setVet.has(id));
  } else {
    idsFinales = idsPorDueño ?? idsPorVet;
  }

  // Query principal
  let query = supabase
    .from("pacientes")
    .select(
      "pac_id, pac_nombre, pac_raz_nombre, pac_raz_siglas, pac_sexo, pac_cliente, pac_fecha_nac, pac_microchip",
      { count: "exact" },
    )
    .order("pac_nombre")
    .range(from, to);

  if (mascota) {
    query = query.ilike("pac_nombre", `%${mascota}%`);
  }
  if (idsFinales !== null) {
    if (idsFinales.length === 0) {
      query = query.eq("pac_id", -1);
    } else {
      query = query.in("pac_id", idsFinales.slice(0, 500));
    }
  }

  const { data: pacientes, count } = await query;
  const total = count ?? 0;
  const pages = Math.ceil(total / PAGE_SIZE);
  const paginaHref = (p: number) =>
    `?mascota=${mascota}&dueño=${dueño}&vet=${vet}&page=${p}`;

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-800">Pacientes</h1>
        <p className="text-xs text-slate-500">{total.toLocaleString("es-AR")} registros</p>
      </div>

      <form method="GET" className="mb-4 grid grid-cols-3 gap-2 max-w-2xl">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">🐾 Mascota</label>
          <Input name="mascota" defaultValue={mascota} placeholder="Nombre de la mascota…" className="text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">👤 Dueño</label>
          <Input name="dueño" defaultValue={dueño} placeholder="Nombre o apellido…" className="text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">🩺 Veterinario</label>
          <Input name="vet" defaultValue={vet} placeholder="Nombre del veterinario…" className="text-sm" />
        </div>
        <div className="col-span-3 flex gap-2">
          <Button type="submit" size="sm">Buscar</Button>
          {hayFiltro && (
            <Link href="/dashboard/pacientes">
              <Button variant="outline" size="sm">Limpiar</Button>
            </Link>
          )}
        </div>
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
                <td className="px-4 py-2.5 text-lg">{ESPECIE[p.pac_raz_siglas?.trim()] ?? "🐾"}</td>
                <td className="px-4 py-2.5 text-slate-600">{p.pac_raz_nombre?.trim()}</td>
                <td className="px-4 py-2.5 text-slate-600">
                  {p.pac_sexo === "M" ? "♂ Macho" : p.pac_sexo === "H" ? "♀ Hembra" : p.pac_sexo?.trim() || "—"}
                </td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{p.pac_fecha_nac?.trim() || "—"}</td>
                <td className="px-4 py-2.5 text-slate-500 text-xs font-mono">{p.pac_microchip?.trim() || "—"}</td>
                <td className="px-4 py-2.5 text-slate-400 text-xs">{p.pac_cliente}</td>
              </tr>
            ))}
            {(!pacientes || pacientes.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">Sin resultados</td>
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
