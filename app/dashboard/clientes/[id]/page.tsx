import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { NuevaMascota } from "./NuevaMascota";
import { ClientActions } from "./ClientActions";
import { argentinaDate } from "@/lib/date";

const clean = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text && text !== "0" ? text : "—";
};

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clientId = Number(id);
  if (!Number.isInteger(clientId)) notFound();
  const supabase = createAdminClient();
  const today = argentinaDate();
  const [{ data: cliente }, { data: mascotas }, { data: saldos }, { data: turnos }] = await Promise.all([
    supabase.from("clientes").select("*").eq("cli_id", clientId).single(),
    supabase.from("pacientes").select("pac_id,pac_nombre,pac_raz_nombre,pac_raz_siglas,pac_sexo,pac_fecha_nac").eq("pac_cliente", clientId).order("pac_nombre"),
    supabase.from("saldo").select("sal_id,sal_fecha,sal_p_d,sal_importe,sal_concepto").eq("sal_idcliente", clientId).order("sal_fecha", { ascending: false }).limit(20),
    supabase.from("turnos").select("id,fecha,hora,paciente_id,motivo,estado").eq("cliente_id", clientId).gte("fecha", today).neq("estado", "cancelado").order("fecha").order("hora").limit(20),
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
    <ClientActions cliente={cliente} />
    <section className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="mb-4 text-base font-semibold text-slate-800">Información de contacto</h2><dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">{fields.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className="break-words text-slate-800">{clean(value)}</dd></div>)}</dl></section>
    <section className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="mb-3 text-base font-semibold text-slate-800">💰 Saldo e historial</h2><div className="space-y-2 md:hidden">{saldos?.map((saldo) => <article key={saldo.sal_id} className="rounded-lg border p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-800">{clean(saldo.sal_concepto)}</p><p className="mt-1 text-xs text-slate-500">{clean(saldo.sal_fecha)} · {clean(saldo.sal_p_d)}</p></div><span className="shrink-0 font-medium text-slate-800">${Number(saldo.sal_importe || 0).toLocaleString("es-AR")}</span></div></article>)}{!saldos?.length&&<p className="py-3 text-sm text-slate-400">No hay movimientos de saldo importados.</p>}</div><div className="hidden overflow-x-auto md:block"><table className="w-full text-sm"><thead><tr className="border-b text-left text-slate-500"><th className="p-2">Fecha</th><th className="p-2">Concepto</th><th className="p-2">Tipo</th><th className="p-2">Importe</th></tr></thead><tbody>{saldos?.map(s=><tr key={s.sal_id} className="border-b"><td className="p-2">{clean(s.sal_fecha)}</td><td className="p-2">{clean(s.sal_concepto)}</td><td className="p-2">{clean(s.sal_p_d)}</td><td className="p-2">${Number(s.sal_importe || 0).toLocaleString("es-AR")}</td></tr>)}</tbody></table>{!saldos?.length&&<p className="py-3 text-sm text-slate-400">No hay movimientos de saldo importados.</p>}</div></section>
    {turnos && turnos.length > 0 && <section className="rounded-xl border bg-white p-5 shadow-sm"><div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-base font-semibold text-slate-800">🗓️ Próximos turnos ({turnos.length})</h2><Link href="/dashboard/turnos" className="text-xs text-blue-700 hover:underline">Abrir agenda</Link></div><div className="space-y-2">{turnos.map((turno) => { const mascota = mascotas?.find((pet) => Number(pet.pac_id) === Number(turno.paciente_id)); return <Link key={turno.id} href={`/dashboard/pacientes/${turno.paciente_id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 hover:bg-slate-50"><div><p className="text-sm font-medium text-slate-800">🐾 {clean(mascota?.pac_nombre)} · {turno.motivo}</p><p className="mt-1 text-xs text-slate-500">{turno.fecha} · {String(turno.hora).slice(0, 5)}</p></div><span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">{turno.estado}</span></Link>; })}</div></section>}
    <section><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-semibold text-slate-800">🐾 Mascotas ({mascotas?.length ?? 0})</h2><div className="flex flex-wrap gap-2"><NuevaMascota clienteId={clientId}/><Link href={`/dashboard/turnos?cliente_id=${clientId}`}><Button variant="outline" size="sm">🗓️ Agendar turno</Button></Link><Link href={`/dashboard/pacientes?cliente_id=${clientId}`}><Button variant="outline" size="sm">Ver lista</Button></Link></div></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{mascotas?.map((p) => <Link key={p.pac_id} href={`/dashboard/pacientes/${p.pac_id}`} className="rounded-xl border bg-white p-4 shadow-sm transition hover:border-slate-400 hover:shadow-md"><div className="font-semibold text-slate-800">{p.pac_raz_siglas?.trim() === "F" ? "🐱" : "🐾"} {clean(p.pac_nombre)}</div><div className="mt-1 text-sm text-slate-600">{clean(p.pac_raz_nombre)} · {clean(p.pac_sexo)}</div><div className="mt-2 text-xs text-blue-700">Abrir ficha clínica →</div></Link>)}{(!mascotas || mascotas.length === 0) && <div className="rounded-xl border bg-white p-6 text-sm text-slate-400">Este cliente no tiene mascotas registradas.</div>}</div></section>
  </div>;
}
