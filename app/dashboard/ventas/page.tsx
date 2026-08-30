import { VentasPanel } from "@/components/operacion/VentasPanel";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function VentasPage() {
  const supabase = createAdminClient();
  const [{ data: productos, error }, { data: ventas }] = await Promise.all([
    supabase.from("inventario").select("id, nombre, stock, precio").order("nombre"),
    supabase.from("ventas").select("id, fecha, veterinario_nombre, importe_total, cantidad_items, notas").order("fecha", { ascending: false }).limit(30),
  ]);
  const saleRows = ventas ?? [];
  return <div className="space-y-5"><div><h1 className="text-xl font-semibold text-slate-800">Ventas</h1><p className="text-sm text-slate-500">Cada venta descuenta el stock en una única transacción.</p></div>{error ? <p className="text-red-600">Ejecutá primero la migración SQL de consolidación.</p> : <VentasPanel productos={productos ?? []} />}<div className="bg-white border rounded-xl overflow-hidden"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-slate-600"><tr><th className="p-3">Fecha</th><th>Veterinario</th><th>Ítems</th><th>Total</th></tr></thead><tbody>{saleRows.map((v) => <tr key={v.id} className="border-t"><td className="p-3">{new Date(v.fecha).toLocaleString("es-AR")}</td><td>{v.veterinario_nombre}</td><td>{v.cantidad_items}</td><td>${Number(v.importe_total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td></tr>)}</tbody></table>{saleRows.length === 0 && <p className="p-8 text-center text-slate-400">Todavía no hay ventas.</p>}</div></div>;
}
