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
      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-lg w-fit">
        {tabs.map((t) => (
          <Link key={t.key} href={`?tab=${t.key}&page=1`}>
            <button
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
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

      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.map((row: Record<string, unknown>, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2.5 text-slate-600 text-xs">#{String(row[ID_MAP[activeTab]] ?? "")}</td>
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
              </tr>
            ))}
            {(!data || data.length === 0) && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Sin resultados</td></tr>
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
