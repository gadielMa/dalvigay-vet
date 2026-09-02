import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const clean = (value: unknown) => String(value ?? "").trim() || "—";

export default async function EctoEndoPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const term = q.replace(/[,%()]/g, " ").trim();
  const supabase = createAdminClient();
  let patientIds: number[] = [];
  if (term) {
    const [{ data: pets }, { data: owners }] = await Promise.all([
      supabase.from("pacientes").select("pac_id").ilike("pac_nombre", `%${term}%`).limit(500),
      supabase.from("clientes").select("cli_id").or(`cli_nombre.ilike.%${term}%,cli_apellido.ilike.%${term}%,cli_razsoc.ilike.%${term}%`).limit(500),
    ]);
    const ownerIds = (owners ?? []).map((owner) => Number(owner.cli_id)).filter(Number.isFinite);
    const { data: petsOfOwners } = ownerIds.length ? await supabase.from("pacientes").select("pac_id").in("pac_cliente", ownerIds) : { data: [] as { pac_id: number }[] };
    patientIds = [...new Set([...(pets ?? []), ...(petsOfOwners ?? [])].map((pet) => Number(pet.pac_id)).filter(Number.isFinite))];
  }
  let query = supabase.from("ectoendo").select("*").order("ee_fvisita", { ascending: false }).limit(300);
  if (term) {
    const filters = [`ee_tipo.ilike.%${term}%`, `ee_dr.ilike.%${term}%`, `ee_detalle.ilike.%${term}%`];
    if (patientIds.length) filters.push(`ee_idpaciente.in.(${patientIds.slice(0, 500).join(",")})`);
    query = query.or(filters.join(","));
  }
  const { data, error } = await query;
  const rows = data ?? [];
  const ids = [...new Set(rows.map((row) => Number(row.ee_idpaciente)).filter(Number.isFinite))];
  const { data: pets } = ids.length ? await supabase.from("pacientes").select("pac_id,pac_nombre,pac_cliente").in("pac_id", ids) : { data: [] as { pac_id: number; pac_nombre?: string | null; pac_cliente?: number | null }[] };
  const petNames = Object.fromEntries((pets ?? []).map((pet) => [String(pet.pac_id), pet.pac_nombre?.trim() || `Paciente #${pet.pac_id}`]));
  const ownerIds = [...new Set((pets ?? []).map((pet) => Number(pet.pac_cliente)).filter(Number.isFinite))];
  const { data: owners } = ownerIds.length ? await supabase.from("clientes").select("cli_id,cli_nombre,cli_apellido").in("cli_id", ownerIds) : { data: [] as { cli_id: number; cli_nombre?: string | null; cli_apellido?: string | null }[] };
  const ownerNames = Object.fromEntries((owners ?? []).map((owner) => [String(owner.cli_id), `${owner.cli_apellido?.trim() || ""}, ${owner.cli_nombre?.trim() || ""}`.replace(/^, |, $/g, "") || `Cliente #${owner.cli_id}`]));
  const ownerFor = (id: unknown) => (pets ?? []).find((pet) => Number(pet.pac_id) === Number(id))?.pac_cliente;

  return <div><div className="mb-4"><h1 className="text-xl font-semibold text-slate-800">🪱 Ecto / endoparasitarios</h1><p className="text-sm text-slate-500">Tratamientos, aplicaciones y próximas fechas.</p></div><form method="GET" className="mb-5 flex max-w-lg gap-2"><Input name="q" defaultValue={q} placeholder="Mascota, dueño, tratamiento o veterinario…" className="text-sm"/><Button type="submit" size="sm">Buscar</Button>{q && <Link href="/dashboard/ectoendo"><Button type="button" variant="outline" size="sm">Limpiar</Button></Link>}</form>{error ? <p className="rounded-xl border bg-white p-6 text-sm text-red-600">No se pudo cargar el historial.</p> : <><div className="space-y-2 md:hidden">{rows.map((row) => { const ownerId = ownerFor(row.ee_idpaciente); return <article key={row.ee_id} className="rounded-xl border bg-white p-4 shadow-sm"><Link href={`/dashboard/pacientes/${row.ee_idpaciente}`} className="font-semibold text-slate-800 hover:text-blue-700">🐾 {petNames[String(row.ee_idpaciente)] || `Paciente #${row.ee_idpaciente}`}</Link><p className="mt-1 text-sm text-slate-700">{clean(row.ee_tipo)}</p><p className="mt-1 text-xs text-slate-500">Aplicación: {clean(row.ee_fvisita)} · Próxima: {clean(row.ee_fproxima)} · Dr/a: {clean(row.ee_dr)}</p>{ownerId && <Link href={`/dashboard/clientes/${ownerId}`} className="mt-1 block truncate text-xs text-blue-700 hover:underline">👤 {ownerNames[String(ownerId)] || "Ver dueño"}</Link>}{row.ee_detalle?.trim() && <p className="mt-3 border-t pt-2 text-xs leading-relaxed text-slate-600">{row.ee_detalle.trim()}</p>}</article>; })}{!rows.length && <p className="rounded-xl border bg-white p-8 text-center text-slate-400">Sin resultados.</p>}</div><div className="hidden overflow-x-auto rounded-xl border bg-white shadow-sm md:block"><table className="w-full text-sm"><thead className="border-b bg-slate-50 text-left text-slate-600"><tr><th className="p-3">Mascota</th><th className="p-3">Dueño</th><th className="p-3">Tratamiento</th><th className="p-3">Aplicación</th><th className="p-3">Próxima</th><th className="p-3">Veterinario</th><th className="p-3">Detalle</th></tr></thead><tbody>{rows.map((row) => { const ownerId = ownerFor(row.ee_idpaciente); return <tr key={row.ee_id} className="border-t"><td className="p-3"><Link href={`/dashboard/pacientes/${row.ee_idpaciente}`} className="text-blue-700 hover:underline">{petNames[String(row.ee_idpaciente)] || `#${row.ee_idpaciente}`}</Link></td><td className="p-3 text-xs">{ownerId ? <Link href={`/dashboard/clientes/${ownerId}`} className="text-blue-700 hover:underline">{ownerNames[String(ownerId)] || "—"}</Link> : "—"}</td><td className="p-3">{clean(row.ee_tipo)}</td><td className="p-3 text-xs">{clean(row.ee_fvisita)}</td><td className="p-3 text-xs">{clean(row.ee_fproxima)}</td><td className="p-3 text-xs">{clean(row.ee_dr)}</td><td className="max-w-xs p-3 text-xs text-slate-600">{clean(row.ee_detalle)}</td></tr>; })}</tbody></table>{!rows.length && <p className="p-8 text-center text-slate-400">Sin resultados.</p>}</div></>}</div>;
}
