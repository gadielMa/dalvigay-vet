import { createAdminClient } from "@/lib/supabase/admin";
import EnviarBtn from "./EnviarBtn";

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
    supabase.from("clientes").select("cli_id, cli_nombre, cli_apellido, cli_mail, cli_celu").in("cli_id", cliIds),
  ]);

  const pacMap = Object.fromEntries((pacientes ?? []).map((p) => [String(p.pac_id), p]));
  const cliMap = Object.fromEntries((clientes ?? []).map((c) => [String(c.cli_id), c]));

  const ESPECIE: Record<string, string> = { C: "🐶", F: "🐱", AVE: "🐦" };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-800">Recordatorios de vacunas</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {vacunas?.length ?? 0} vacunas con fecha próxima pendiente · hacé click en 📧 para enviar el recordatorio
        </p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Mascota</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Dueño</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Email</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Vacuna</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Última visita</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Próxima</th>
              <th className="px-4 py-2.5 text-center font-medium text-slate-600">Enviar</th>
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
                    <span className="font-medium text-slate-800">{pac?.pac_nombre?.trim() ?? `#${v.vac_idpaciente}`}</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {cli ? `${cli.cli_nombre?.trim()} ${cli.cli_apellido?.trim()}` : `#${v.vac_idcliente}`}
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
