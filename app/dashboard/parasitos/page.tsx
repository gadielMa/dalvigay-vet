import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function ParasitosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const term = q.replace(/[,%()]/g, " ").trim();
  let query = createAdminClient().from("parasitos").select("*").order("pa_ecto_endo").order("pa_nombre");
  if (term) query = query.or(`pa_nombre.ilike.%${term}%,pa_tipo.ilike.%${term}%,pa_ecto_endo.ilike.%${term}%`);
  const { data, error } = await query;

  return <div className="max-w-3xl"><div className="mb-4"><h1 className="text-xl font-semibold text-slate-800">🪱 Parásitos</h1><p className="text-sm text-slate-500">Catálogo histórico de ectoparásitos y endoparásitos.</p></div><form method="GET" className="mb-5 flex max-w-md gap-2"><Input name="q" defaultValue={q} placeholder="Buscar por nombre o tipo…" className="text-sm"/><Button type="submit" size="sm">Buscar</Button>{q && <Link href="/dashboard/parasitos"><Button type="button" variant="outline" size="sm">Limpiar</Button></Link>}</form>{error ? <p className="rounded-xl border bg-white p-6 text-sm text-red-600">No se pudo cargar el catálogo.</p> : <div className="grid gap-3 sm:grid-cols-2">{data?.map((p) => <div key={p.pa_id} className="rounded-xl border bg-white p-4 shadow-sm"><div className="font-medium text-slate-800">{p.pa_nombre?.trim() || `Parásito #${p.pa_id}`}</div><div className="mt-1 text-sm text-slate-600">{p.pa_tipo?.trim() || "Tipo no registrado"}</div><span className={`mt-3 inline-block rounded-full px-2 py-1 text-xs ${p.pa_ecto_endo?.trim().toLowerCase() === "ecto" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{p.pa_ecto_endo?.trim() || "Sin clasificación"}</span></div>)}{(!data || data.length === 0) && <p className="col-span-full rounded-xl border bg-white p-8 text-center text-slate-400">Sin resultados.</p>}</div>}</div>;
}
