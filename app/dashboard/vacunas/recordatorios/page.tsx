import { createAdminClient } from "@/lib/supabase/admin";
import EnviarBtn from "./EnviarBtn";
import Link from "next/link";

export default async function RecordatoriosPage() {
  const supabase = createAdminClient();

  // Vacunas con fecha próxima no vacía, ordenadas por fecha
  const { data: vacunas } = await supabase
    .from("vacunas")
    .select("vac_id, vac_idpaciente, vac_idcliente, vac_fvisita, vac_fproxima, vac_marca, vac_clase, vac_dr, vac_pac_raz_esp")
    .neq("vac_fproxima", "")
    .not("vac_fproxima", "is", null)
    .order("vac_fproxima")
    .limit(200);

  // Cargar pacientes y clientes de esas vacunas
  const pacIds = [...new Set(vacunas?.map((v) => v.vac_idpaciente) ?? [])];
  const cliIds = [...new Set(vacunas?.map((v) => v.vac_idcliente) ?? [])];

  const [{ data: pacientes }, { data: clientes }] = await Promise.all([
    supabase.from("pacientes").select("pac_id, pac_nombre, pac_raz_siglas").in("pac_id", pacIds),
    supabase.from("clientes").select("cli_id, cli_nombre, cli_apellido, cli_mail, cli_celu, cli_tel1").in("cli_id", cliIds),
  ]);

  const pacMap = Object.fromEntries((pacientes ?? []).map((p) => [String(p.pac_id), p]));
  const cliMap = Object.fromEntries((clientes ?? []).map((c) => [String(c.cli_id), c]));

  const ESPECIE: Record<string, string> = { C: "🐶", F: "🐱", AVE: "🐦" };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-800">Recordatorios de vacunas</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {vacunas?.length ?? 0} vacunas con fecha próxima pendiente · email o WhatsApp con un toque
        </p>
      </div>

      <div className="space-y-2 md:hidden">
        {vacunas?.map((v) => {
          const pac = pacMap[String(v.vac_idpaciente)];
          const cli = cliMap[String(v.vac_idcliente)];
          const petName = pac?.pac_nombre?.trim() || `Mascota #${v.vac_idpaciente}`;
          const ownerName = cli ? `${cli.cli_nombre?.trim() ?? ""} ${cli.cli_apellido?.trim() ?? ""}`.trim() : `Cliente #${v.vac_idcliente}`;
          const phone = String(cli?.cli_celu || cli?.cli_tel1 || "").replace(/\D/g, "").replace(/^0/, "").replace(/^15/, "");
          const text = `Hola ${ownerName}, te recordamos que ${petName} tiene pendiente ${v.vac_marca?.trim() || "una vacuna"}${v.vac_clase?.trim() ? ` (${v.vac_clase.trim()})` : ""} para el ${v.vac_fproxima?.trim() || "próximo control"}. Veterinaria Dalvigay.`;
          return <article key={v.vac_id} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link href={`/dashboard/pacientes/${v.vac_idpaciente}`} className="block truncate font-semibold text-slate-800 hover:text-blue-700">{ESPECIE[pac?.pac_raz_siglas?.trim() ?? ""] ?? "🐾"} {petName}</Link><Link href={`/dashboard/clientes/${v.vac_idcliente}`} className="mt-1 block truncate text-sm text-slate-500 hover:text-blue-700">{ownerName}</Link></div><span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">{v.vac_fproxima?.trim()}</span></div>
            <p className="mt-3 text-sm text-slate-600"><b>{v.vac_marca?.trim() || "Vacuna"}</b>{v.vac_clase?.trim() ? ` · ${v.vac_clase.trim()}` : ""}</p>
            <div className="mt-3 flex flex-wrap gap-2"><EnviarBtn vacId={v.vac_id} disabled={!cli?.cli_mail || cli.cli_mail === "0"}/>{phone && <a className="inline-flex h-8 items-center rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-800" target="_blank" rel="noreferrer" href={`https://wa.me/54${phone}?text=${encodeURIComponent(text)}`}>WhatsApp</a>}</div>
          </article>;
        })}
        {(!vacunas || vacunas.length === 0) && <p className="rounded-xl border bg-white p-8 text-center text-slate-400">Sin recordatorios pendientes</p>}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border bg-white shadow-sm md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Mascota</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Dueño</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Email</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Vacuna</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Última visita</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Próxima</th>
              <th className="px-4 py-2.5 text-center font-medium text-slate-600">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vacunas?.map((v) => {
              const pac = pacMap[String(v.vac_idpaciente)];
              const cli = cliMap[String(v.vac_idcliente)];
              const tieneEmail = cli?.cli_mail && cli.cli_mail !== "0";
              return (
                <tr key={v.vac_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="mr-1">{ESPECIE[pac?.pac_raz_siglas?.trim() ?? ""] ?? "🐾"}</span>
                    <Link href={`/dashboard/pacientes/${v.vac_idpaciente}`} className="font-medium text-slate-800 hover:text-blue-700 hover:underline">{pac?.pac_nombre?.trim() ?? `#${v.vac_idpaciente}`}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    <Link href={`/dashboard/clientes/${v.vac_idcliente}`} className="hover:text-blue-700 hover:underline">{cli ? `${cli.cli_nombre?.trim()} ${cli.cli_apellido?.trim()}` : `#${v.vac_idcliente}`}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">
                    {tieneEmail ? cli!.cli_mail : <span className="text-red-400 italic">sin email</span>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">
                    <span className="font-medium">{v.vac_marca?.trim() || "—"}</span>
                    {v.vac_clase?.trim() && <span className="text-slate-400 ml-1 text-xs">· {v.vac_clase.trim()}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{v.vac_fvisita?.trim() || "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      {v.vac_fproxima?.trim()}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <EnviarBtn vacId={v.vac_id} disabled={!tieneEmail} />
                  </td>
                </tr>
              );
            })}
            {(!vacunas || vacunas.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">Sin recordatorios pendientes</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
