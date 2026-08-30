import { InventarioPanel } from "@/components/operacion/InventarioPanel";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function InventarioPage() {
  const { data, error } = await createAdminClient().from("inventario").select("*").order("nombre");
  return <div><h1 className="text-xl font-semibold text-slate-800 mb-1">Inventario</h1><p className="text-sm text-slate-500 mb-5">Productos y alertas de stock mínimo.</p>{error ? <p className="text-red-600">Ejecutá primero la migración SQL de consolidación.</p> : <InventarioPanel productos={data ?? []} />}</div>;
}
