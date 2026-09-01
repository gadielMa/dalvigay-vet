import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 40;

type Tab = "hemogramas" | "orina" | "quimica";

export default async function AnalisisPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const { tab = "hemogramas", page = "1" } = await searchParams;
  const activeTab = (["hemogramas", "orina", "quimica"].includes(tab) ? tab : "hemogramas") as Tab;
  const supabase = createAdminClient();
  const current = Math.max(1, parseInt(page));
  const from = (current - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const TABLE_MAP: Record<Tab, string> = {
    hemogramas: "hemogramas",
    orina: "orina",
    quimica: "quimicasang",
  };
  const ID_MAP: Record<Tab, string> = {
    hemogramas: "hem_idpaciente",
    orina: "ori_idpaciente",
    quimica: "qs_idpaciente",
  };
  const DATE_MAP: Record<Tab, string> = {
    hemogramas: "hem_fvisita",
    orina: "ori_fecha",
    quimica: "qs_fvisita",
  };
  const DR_MAP: Record<Tab, string> = {
    hemogramas: "hem_dr",
    orina: "ori_dr",
    quimica: "qs_dr",
  };

  const { data, count } = await supabase
    .from(TABLE_MAP[activeTab])
    .select("*", { count: "exact" })
    .order(DATE_MAP[activeTab], { ascending: false })
    .range(from, to);

  const patientIds = [...new Set((data ?? []).map((row) => Number(row[ID_MAP[activeTab]])).filter(Number.isFinite))];
  const { data: pacientes } = patientIds.length
    ? await supabase.from("pacientes").select("pac_id,pac_nombre").in("pac_id", patientIds)
    : { data: [] as { pac_id: number; pac_nombre?: string | null }[] };
  const patientNames = Object.fromEntries((pacientes ?? []).map((patient) => [String(patient.pac_id), patient.pac_nombre?.trim() || `Paciente #${patient.pac_id}`]));

  const total = count ?? 0;
  const pages = Math.ceil(total / PAGE_SIZE);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "hemogramas", label: "Hemogramas", icon: "🩸" },
    { key: "orina", label: "Orina", icon: "🧪" },
    { key: "quimica", label: "Química Sanguínea", icon: "⚗️" },
  ];

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-800">Análisis</h1>
        <p className="text-xs text-slate-500">{total.toLocaleString("es-AR")} registros</p>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
        {tabs.map((t) => (
          <Link key={t.key} href={`?tab=${t.key}&page=1`}>
            <button
              className={`whitespace-nowrap px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? "bg-white shadow-sm text-slate-800"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.icon} {t.label}
            </button>
          </Link>
        ))}
      </div>

      <div className="space-y-2 md:hidden">
        {data?.map((row: Record<string, unknown>, index) => {
          const patientId = String(row[ID_MAP[activeTab]] ?? "");
          const metrics = activeTab === "hemogramas" ? [["Leucocitos", row.hem_leucocitos], ["Hemoglobina", row.hem_hemoglobina], ["Hematocrito", row.hem_hematocritos], ["Plaquetas", row.hem_plaquetas]] : activeTab === "orina" ? [["Color", row.ori_color], ["pH", row.ori_ph], ["Densidad", row.ori_densidad], ["Proteínas", row.ori_proteinas]] : [["Glucosa", row.qs_glucosa2], ["Urea", row.qs_urea], ["Creatinina", row.qs_creatinina], ["Colesterol", row.qs_colesterol]];
          return <article key={index} className="rounded-xl border bg-white p-4 shadow-sm"><Link href={`/dashboard/pacientes/${patientId}`} className="block truncate font-semibold text-slate-800 hover:text-blue-700">🐾 {patientNames[patientId] || `Paciente #${patientId}`}</Link><p className="mt-1 text-xs text-slate-500">{String(row[DATE_MAP[activeTab]] ?? "").trim() || "Sin fecha"} · Dr/a: {String(row[DR_MAP[activeTab]] ?? "").trim() || "—"}</p><dl className="mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-xs">{metrics.map(([name, value]) => <div key={String(name)}><dt className="text-slate-500">{String(name)}</dt><dd className="font-medium text-slate-800">{String(value ?? "").trim() || "—"}</dd></div>)}</dl><details className="mt-3 text-xs text-blue-700"><summary className="cursor-pointer">Ver resultados completos</summary><dl className="mt-3 grid gap-2 rounded-lg border bg-slate-50 p-3 text-slate-800">{Object.entries(row).filter(([key,value]) => !/(_id|idpaciente)$/i.test(key) && String(value ?? "").trim() && String(value).trim() !== "0").map(([key,value]) => <div key={key}><dt className="text-[10px] uppercase text-slate-500">{label(key)}</dt><dd className="break-words">{String(value).trim()}</dd></div>)}</dl></details></article>;
        })}
        {(!data || data.length === 0) && <p className="rounded-xl border bg-white p-8 text-center text-slate-400">Sin resultados</p>}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border bg-white shadow-sm md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Paciente</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Fecha</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Médico</th>
              {activeTab === "hemogramas" && <>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">Leucocitos</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">Hemoglobina</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">Hematocrito</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">Plaquetas</th>
              </>}
              {activeTab === "orina" && <>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">Color</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">pH</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">Densidad</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">Proteínas</th>
              </>}
              {activeTab === "quimica" && <>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">Glucosa</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">Urea</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">Creatinina</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">Colesterol</th>
              </>}
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.map((row: Record<string, unknown>, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2.5 text-xs"><Link href={`/dashboard/pacientes/${String(row[ID_MAP[activeTab]] ?? "")}`} className="text-blue-700 hover:underline">🐾 {patientNames[String(row[ID_MAP[activeTab]] ?? "")] || `#${String(row[ID_MAP[activeTab]] ?? "")}`}</Link></td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{String(row[DATE_MAP[activeTab]] ?? "").trim() || "—"}</td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{String(row[DR_MAP[activeTab]] ?? "").trim() || "—"}</td>
                {activeTab === "hemogramas" && <>
                  <td className="px-4 py-2.5 text-xs">{String(row.hem_leucocitos ?? "").trim() || "—"}</td>
                  <td className="px-4 py-2.5 text-xs">{String(row.hem_hemoglobina ?? "").trim() || "—"}</td>
                  <td className="px-4 py-2.5 text-xs">{String(row.hem_hematocritos ?? "").trim() || "—"}</td>
                  <td className="px-4 py-2.5 text-xs">{String(row.hem_plaquetas ?? "").trim() || "—"}</td>
                </>}
                {activeTab === "orina" && <>
                  <td className="px-4 py-2.5 text-xs">{String(row.ori_color ?? "").trim() || "—"}</td>
                  <td className="px-4 py-2.5 text-xs">{String(row.ori_ph ?? "").trim() || "—"}</td>
                  <td className="px-4 py-2.5 text-xs">{String(row.ori_densidad ?? "").trim() || "—"}</td>
                  <td className="px-4 py-2.5 text-xs">{String(row.ori_proteinas ?? "").trim() || "—"}</td>
                </>}
                {activeTab === "quimica" && <>
                  <td className="px-4 py-2.5 text-xs">{String(row.qs_glucosa2 ?? "").trim() || "—"}</td>
                  <td className="px-4 py-2.5 text-xs">{String(row.qs_urea ?? "").trim() || "—"}</td>
                  <td className="px-4 py-2.5 text-xs">{String(row.qs_creatinina ?? "").trim() || "—"}</td>
                  <td className="px-4 py-2.5 text-xs">{String(row.qs_colesterol ?? "").trim() || "—"}</td>
                </>}
                <td className="px-4 py-2.5 text-xs"><details><summary className="cursor-pointer text-blue-700">Ver completo</summary><dl className="mt-2 grid min-w-72 gap-2 rounded border bg-white p-3 sm:grid-cols-2">{Object.entries(row).filter(([key,value]) => !/(_id|idpaciente)$/i.test(key) && String(value ?? "").trim() && String(value).trim() !== "0").map(([key,value])=><div key={key}><dt className="text-[10px] uppercase text-slate-500">{label(key)}</dt><dd className="break-words text-slate-800">{String(value).trim()}</dd></div>)}</dl></details></td>
              </tr>
            ))}
            {(!data || data.length === 0) && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center gap-2 mt-4 text-sm">
          {current > 1 && <Link href={`?tab=${activeTab}&page=${current - 1}`}><Button variant="outline" size="sm">← Anterior</Button></Link>}
          <span className="text-slate-500">Página {current} de {pages}</span>
          {current < pages && <Link href={`?tab=${activeTab}&page=${current + 1}`}><Button variant="outline" size="sm">Siguiente →</Button></Link>}
        </div>
      )}
    </div>
  );
}

function label(key: string) { return key.replace(/^(hem|ori|qs)_/i, "").replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase()); }
