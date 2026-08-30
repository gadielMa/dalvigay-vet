import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";

const clean = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text && text !== "0" ? text : "—";
};

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clientId = Number(id);
  if (!Number.isInteger(clientId)) notFound();
  const supabase = createAdminClient();
  const [{ data: cliente }, { data: mascotas }] = await Promise.all([
    supabase.from("clientes").select("*").eq("cli_id", clientId).single(),
    supabase.from("pacientes").select("pac_id,pac_nombre,pac_raz_nombre,pac_raz_siglas,pac_sexo,pac_fecha_nac").eq("pac_cliente", clientId).order("pac_nombre"),
  ]);
  if (!cliente) notFound();
  const fields = [
    ["Teléfono", cliente.cli_tel1], ["Celular", cliente.cli_celu], ["Email", cliente.cli_mail],
    ["CUIT", cliente.cli_cuit], ["Domicilio", cliente.cli_domic], ["Entre calles", cliente.cli_entre],
    ["Localidad", cliente.cli_loc], ["Código postal", cliente.cli_cp], ["Provincia", cliente.cli_prov],
    ["País", cliente.cli_pais], ["Tipo", cliente.cli_tipo], ["Alta", cliente.cli_fecha_alta],
  ];
  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="flex flex-wrap items-center gap-3"><Link href="/dashboard/clientes"><Button variant="outline" size="sm">← Clientes</Button></Link><div><h1 className="text-2xl font-semibold text-slate-800">👤 {clean(cliente.cli_apellido)}, {clean(cliente.cli_nombre)}</h1><p className="text-sm text-slate-500">Cliente #{cliente.cli_id}</p></div></div>
    <section className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="mb-4 text-base font-semibold text-slate-800">Información de contacto</h2><dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">{fields.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className="break-words text-slate-800">{clean(value)}</dd></div>)}</dl></section>
    <section><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold text-slate-800">🐾 Mascotas ({mascotas?.length ?? 0})</h2><Link href={`/dashboard/pacientes?cliente_id=${clientId}`}><Button variant="outline" size="sm">Ver lista</Button></Link></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{mascotas?.map((p) => <Link key={p.pac_id} href={`/dashboard/pacientes/${p.pac_id}`} className="rounded-xl border bg-white p-4 shadow-sm transition hover:border-slate-400 hover:shadow-md"><div className="font-semibold text-slate-800">{p.pac_raz_siglas?.trim() === "F" ? "🐱" : "🐾"} {clean(p.pac_nombre)}</div><div className="mt-1 text-sm text-slate-600">{clean(p.pac_raz_nombre)} · {clean(p.pac_sexo)}</div><div className="mt-2 text-xs text-blue-700">Abrir ficha clínica →</div></Link>)}{(!mascotas || mascotas.length === 0) && <div className="rounded-xl border bg-white p-6 text-sm text-slate-400">Este cliente no tiene mascotas registradas.</div>}</div></section>
  </div>;
}
