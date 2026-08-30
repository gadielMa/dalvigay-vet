import { ComunicacionPanel } from "@/components/operacion/ComunicacionPanel";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function ComunicacionesPage() {
  const supabase = createAdminClient();
  const [{ data: clientes }, { data: comunicaciones, error }] = await Promise.all([
    supabase.from("clientes").select("cli_id, cli_nombre, cli_apellido, cli_mail").order("cli_apellido").limit(1000),
    supabase.from("comunicaciones").select("id, asunto, enviado_en, enviado_por, cliente_id").order("enviado_en", { ascending: false }).limit(30),
  ]);
  const communicationRows = comunicaciones ?? [];
  return <div className="space-y-5"><div><h1 className="text-xl font-semibold text-slate-800">Comunicaciones</h1><p className="text-sm text-slate-500">Emails manuales con registro de envío. Los SMS quedan fuera hasta elegir un proveedor.</p></div>{error ? <p className="text-red-600">Ejecutá primero la migración SQL de consolidación.</p> : <ComunicacionPanel clientes={clientes ?? []} />}<div className="bg-white border rounded-xl overflow-hidden"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-slate-600"><tr><th className="p-3">Fecha</th><th>Cliente ID</th><th>Asunto</th><th>Enviado por</th></tr></thead><tbody>{communicationRows.map((c) => <tr key={c.id} className="border-t"><td className="p-3">{new Date(c.enviado_en).toLocaleString("es-AR")}</td><td>{c.cliente_id}</td><td>{c.asunto}</td><td>{c.enviado_por}</td></tr>)}</tbody></table>{communicationRows.length === 0 && <p className="p-8 text-center text-slate-400">Todavía no hay comunicaciones.</p>}</div></div>;
}
