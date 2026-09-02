import Link from "next/link";
import { ComunicacionPanel } from "@/components/operacion/ComunicacionPanel";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function ComunicacionesPage({ searchParams }: { searchParams: Promise<{ cliente_id?: string }> }) {
  const { cliente_id = "" } = await searchParams;
  const initialClientId = Number(cliente_id);
  const supabase = createAdminClient();
  const { data: comunicaciones, error } = await supabase.from("comunicaciones").select("id, asunto, enviado_en, enviado_por, cliente_id").order("enviado_en", { ascending: false }).limit(30);
  const communicationRows = comunicaciones ?? [];
  const ids = [...new Set(communicationRows.map((row) => Number(row.cliente_id)).filter(Number.isFinite))];
  const { data: clientes } = ids.length ? await supabase.from("clientes").select("cli_id,cli_nombre,cli_apellido").in("cli_id", ids) : { data: [] as { cli_id: number; cli_nombre?: string | null; cli_apellido?: string | null }[] };
  const { data: initialClient } = Number.isInteger(initialClientId) && initialClientId > 0
    ? await supabase.from("clientes").select("cli_id,cli_nombre,cli_apellido,cli_mail,cli_celu,cli_tel1").eq("cli_id", initialClientId).maybeSingle()
    : { data: null };
  const clientNames = Object.fromEntries((clientes ?? []).map((client) => [String(client.cli_id), `${client.cli_apellido?.trim() ?? ""}, ${client.cli_nombre?.trim() ?? ""}`.replace(/^, /, "") || `Cliente #${client.cli_id}`]));
  return <div className="space-y-5"><div><h1 className="text-xl font-semibold text-slate-800">Comunicaciones</h1><p className="text-sm text-slate-500">Emails manuales con registro de envío. Los SMS quedan fuera hasta elegir un proveedor.</p></div>{error ? <p className="text-red-600">Ejecutá primero la migración SQL de consolidación.</p> : <ComunicacionPanel initialClient={initialClient}/>}<section><h2 className="mb-2 font-semibold text-slate-800">Historial reciente</h2><div className="space-y-2 md:hidden">{communicationRows.map((row) => <Link key={row.id} href={`/dashboard/clientes/${row.cliente_id}`} className="block rounded-xl border bg-white p-4 shadow-sm"><p className="truncate font-medium text-slate-800">{row.asunto}</p><p className="mt-1 truncate text-sm text-slate-600">{clientNames[String(row.cliente_id)] || `Cliente #${row.cliente_id}`}</p><p className="mt-2 text-xs text-slate-500">{new Date(row.enviado_en).toLocaleString("es-AR")} · {row.enviado_por}</p></Link>)}{!communicationRows.length && <p className="rounded-xl border bg-white p-8 text-center text-slate-400">Todavía no hay comunicaciones.</p>}</div><div className="hidden overflow-x-auto rounded-xl border bg-white md:block"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-slate-600"><tr><th className="p-3">Fecha</th><th>Cliente</th><th>Asunto</th><th>Enviado por</th></tr></thead><tbody>{communicationRows.map((row) => <tr key={row.id} className="border-t"><td className="p-3">{new Date(row.enviado_en).toLocaleString("es-AR")}</td><td><Link className="text-blue-700 hover:underline" href={`/dashboard/clientes/${row.cliente_id}`}>{clientNames[String(row.cliente_id)] || `Cliente #${row.cliente_id}`}</Link></td><td>{row.asunto}</td><td>{row.enviado_por}</td></tr>)}</tbody></table>{!communicationRows.length && <p className="p-8 text-center text-slate-400">Todavía no hay comunicaciones.</p>}</div></section></div>;
}
