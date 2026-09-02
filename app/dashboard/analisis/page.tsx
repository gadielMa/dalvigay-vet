import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 40;
type Tab = "hemogramas" | "orina" | "quimica";
const TABLE: Record<Tab, string> = { hemogramas: "hemogramas", orina: "orina", quimica: "quimicasang" };
const PATIENT_ID: Record<Tab, string> = { hemogramas: "hem_idpaciente", orina: "ori_idpaciente", quimica: "qs_idpaciente" };
const DATE: Record<Tab, string> = { hemogramas: "hem_fvisita", orina: "ori_fecha", quimica: "qs_fvisita" };
const DOCTOR: Record<Tab, string> = { hemogramas: "hem_dr", orina: "ori_dr", quimica: "qs_dr" };
const tabs: { key: Tab; label: string; icon: string }[] = [{ key: "hemogramas", label: "Hemogramas", icon: "🩸" }, { key: "orina", label: "Orina", icon: "🧪" }, { key: "quimica", label: "Química Sanguínea", icon: "⚗️" }];
const label = (key: string) => key.replace(/^(hem|ori|qs)_/i, "").replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase());
const visibleMetrics = (tab: Tab, row: Record<string, unknown>) => tab === "hemogramas" ? [["Leucocitos", row.hem_leucocitos], ["Hemoglobina", row.hem_hemoglobina], ["Hematocrito", row.hem_hematocritos], ["Plaquetas", row.hem_plaquetas]] : tab === "orina" ? [["Color", row.ori_color], ["pH", row.ori_ph], ["Densidad", row.ori_densidad], ["Proteínas", row.ori_proteinas]] : [["Glucosa", row.qs_glucosa2], ["Urea", row.qs_urea], ["Creatinina", row.qs_creatinina], ["Colesterol", row.qs_colesterol]];

export default async function AnalisisPage({ searchParams }: { searchParams: Promise<{ tab?: string; page?: string; q?: string }> }) {
  const { tab = "hemogramas", page = "1", q = "" } = await searchParams;
  const activeTab = (tabs.some(item => item.key === tab) ? tab : "hemogramas") as Tab;
  const current = Math.max(1, parseInt(page));
  const term = q.replace(/[,%()]/g, " ").trim();
  const supabase = createAdminClient();

  let searchedPatientIds: number[] = [];
  if (term) {
    const [{ data: matchingPets }, { data: matchingOwners }] = await Promise.all([
      supabase.from("pacientes").select("pac_id").ilike("pac_nombre", `%${term}%`).limit(500),
      supabase.from("clientes").select("cli_id").or(`cli_nombre.ilike.%${term}%,cli_apellido.ilike.%${term}%,cli_razsoc.ilike.%${term}%`).limit(500),
    ]);
    const ownerIds = (matchingOwners ?? []).map(owner => Number(owner.cli_id)).filter(Number.isFinite);
    const { data: petsOfOwners } = ownerIds.length ? await supabase.from("pacientes").select("pac_id").in("pac_cliente", ownerIds) : { data: [] as { pac_id: number }[] };
    searchedPatientIds = [...new Set([...(matchingPets ?? []), ...(petsOfOwners ?? [])].map(pet => Number(pet.pac_id)).filter(Number.isFinite))];
  }

  const from = (current - 1) * PAGE_SIZE;
  let query = supabase.from(TABLE[activeTab]).select("*", { count: "exact" }).order(DATE[activeTab], { ascending: false }).range(from, from + PAGE_SIZE - 1);
  if (term) {
    const filters = [`${DOCTOR[activeTab]}.ilike.%${term}%`];
    if (searchedPatientIds.length) filters.push(`${PATIENT_ID[activeTab]}.in.(${searchedPatientIds.slice(0, 500).join(",")})`);
    query = query.or(filters.join(","));
  }
  const { data, count } = await query;
  const rows = (data ?? []) as Record<string, unknown>[];
  const patientIds = [...new Set(rows.map(row => Number(row[PATIENT_ID[activeTab]])).filter(Number.isFinite))];
  const { data: patients } = patientIds.length ? await supabase.from("pacientes").select("pac_id,pac_nombre,pac_cliente").in("pac_id", patientIds) : { data: [] as { pac_id: number; pac_nombre?: string | null; pac_cliente?: number | null }[] };
  const patientNames = Object.fromEntries((patients ?? []).map(patient => [String(patient.pac_id), patient.pac_nombre?.trim() || `Paciente #${patient.pac_id}`]));
  const ownerIds = [...new Set((patients ?? []).map(patient => Number(patient.pac_cliente)).filter(Number.isFinite))];
  const { data: owners } = ownerIds.length ? await supabase.from("clientes").select("cli_id,cli_nombre,cli_apellido").in("cli_id", ownerIds) : { data: [] as { cli_id: number; cli_nombre?: string | null; cli_apellido?: string | null }[] };
  const ownerNames = Object.fromEntries((owners ?? []).map(owner => [String(owner.cli_id), `${owner.cli_apellido?.trim() || ""}, ${owner.cli_nombre?.trim() || ""}`.replace(/^, |, $/g, "") || `Cliente #${owner.cli_id}`]));
  const ownerFor = (patientId: string) => (patients ?? []).find(patient => String(patient.pac_id) === patientId)?.pac_cliente;
  const total = count ?? 0;
  const pages = Math.ceil(total / PAGE_SIZE);
  const pageHref = (target: number) => `?tab=${activeTab}&q=${encodeURIComponent(q)}&page=${target}`;

  return <div>
    <div className="mb-4"><h1 className="text-xl font-semibold text-slate-800">Análisis</h1><p className="text-xs text-slate-500">{total.toLocaleString("es-AR")} registros</p></div>
    <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">{tabs.map(item => <Link key={item.key} href={`?tab=${item.key}&q=${encodeURIComponent(q)}`} className={`whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium ${activeTab === item.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}>{item.icon} {item.label}</Link>)}</div>
    <form method="GET" className="mb-4 flex max-w-md gap-2"><input type="hidden" name="tab" value={activeTab}/><Input name="q" defaultValue={q} placeholder="Mascota, dueño o veterinario…" className="text-sm"/><Button type="submit" size="sm">Buscar</Button>{q && <Link href={`?tab=${activeTab}`}><Button variant="outline" size="sm">Limpiar</Button></Link>}</form>
    <div className="space-y-2 md:hidden">{rows.map((row, index) => { const patientId = String(row[PATIENT_ID[activeTab]] ?? ""); const ownerId = ownerFor(patientId); return <article key={index} className="rounded-xl border bg-white p-4 shadow-sm"><Link href={`/dashboard/pacientes/${patientId}`} className="block truncate font-semibold text-slate-800 hover:text-blue-700">🐾 {patientNames[patientId] || `Paciente #${patientId}`}</Link><p className="mt-1 text-xs text-slate-500">{String(row[DATE[activeTab]] ?? "").trim() || "Sin fecha"} · Dr/a: {String(row[DOCTOR[activeTab]] ?? "").trim() || "—"}</p>{ownerId && <Link href={`/dashboard/clientes/${ownerId}`} className="mt-1 block truncate text-xs text-blue-700 hover:underline">👤 {ownerNames[String(ownerId)] || "Ver dueño"}</Link>}<Metrics values={visibleMetrics(activeTab, row)}/><Details row={row}/></article>; })}{!rows.length && <p className="rounded-xl border bg-white p-8 text-center text-slate-400">Sin resultados</p>}</div>
    <div className="hidden overflow-x-auto rounded-xl border bg-white shadow-sm md:block"><table className="w-full text-sm"><thead className="border-b bg-slate-50"><tr><th className="px-4 py-2.5 text-left font-medium text-slate-600">Paciente</th><th className="px-4 py-2.5 text-left font-medium text-slate-600">Dueño</th><th className="px-4 py-2.5 text-left font-medium text-slate-600">Fecha</th><th className="px-4 py-2.5 text-left font-medium text-slate-600">Médico</th>{visibleMetrics(activeTab, {}).map(([name]) => <th key={String(name)} className="px-4 py-2.5 text-left font-medium text-slate-600">{String(name)}</th>)}<th className="px-4 py-2.5 text-left font-medium text-slate-600">Detalle</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row, index) => { const patientId = String(row[PATIENT_ID[activeTab]] ?? ""); const ownerId = ownerFor(patientId); return <tr key={index} className="hover:bg-slate-50"><td className="px-4 py-2.5 text-xs"><Link href={`/dashboard/pacientes/${patientId}`} className="text-blue-700 hover:underline">🐾 {patientNames[patientId] || `#${patientId}`}</Link></td><td className="px-4 py-2.5 text-xs">{ownerId ? <Link href={`/dashboard/clientes/${ownerId}`} className="text-blue-700 hover:underline">{ownerNames[String(ownerId)] || "—"}</Link> : "—"}</td><td className="px-4 py-2.5 text-xs text-slate-500">{String(row[DATE[activeTab]] ?? "").trim() || "—"}</td><td className="px-4 py-2.5 text-xs text-slate-500">{String(row[DOCTOR[activeTab]] ?? "").trim() || "—"}</td>{visibleMetrics(activeTab, row).map(([name, value]) => <td key={String(name)} className="px-4 py-2.5 text-xs">{String(value ?? "").trim() || "—"}</td>)}<td className="px-4 py-2.5"><Details row={row}/></td></tr>; })}{!rows.length && <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">Sin resultados</td></tr>}</tbody></table></div>
    {pages > 1 && <div className="mt-4 flex items-center gap-2 text-sm">{current > 1 && <Link href={pageHref(current - 1)}><Button variant="outline" size="sm">← Anterior</Button></Link>}<span className="text-slate-500">Página {current} de {pages}</span>{current < pages && <Link href={pageHref(current + 1)}><Button variant="outline" size="sm">Siguiente →</Button></Link>}</div>}
  </div>;
}

function Metrics({ values }: { values: unknown[][] }) { return <dl className="mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-xs">{values.map(([name, value]) => <div key={String(name)}><dt className="text-slate-500">{String(name)}</dt><dd className="font-medium text-slate-800">{String(value ?? "").trim() || "—"}</dd></div>)}</dl>; }
function Details({ row }: { row: Record<string, unknown> }) { const values = Object.entries(row).filter(([key, value]) => !/(_id|idpaciente)$/i.test(key) && String(value ?? "").trim() && String(value).trim() !== "0"); return <details className="mt-3 text-xs text-blue-700"><summary className="cursor-pointer">Ver resultados completos</summary><dl className="mt-3 grid gap-2 rounded-lg border bg-slate-50 p-3 text-slate-800 sm:grid-cols-2">{values.map(([key, value]) => <div key={key}><dt className="text-[10px] uppercase text-slate-500">{label(key)}</dt><dd className="break-words">{String(value).trim()}</dd></div>)}</dl></details>; }
