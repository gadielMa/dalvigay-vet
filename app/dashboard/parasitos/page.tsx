import { createAdminClient } from "@/lib/supabase/admin";

export default async function ParasitosPage() {
  const { data } = await createAdminClient().from("parasitos").select("*").order("pa_ecto_endo").order("pa_nombre");
  return <div className="max-w-3xl"><h1 className="text-xl font-semibold text-slate-800">🪱 Parásitos</h1><p className="mb-5 text-sm text-slate-500">Catálogo histórico de ectoparásitos y endoparásitos.</p><div className="grid gap-3 sm:grid-cols-2">{data?.map((p) => <div key={p.pa_id} className="rounded-xl border bg-white p-4 shadow-sm"><div className="font-medium text-slate-800">{p.pa_nombre?.trim()}</div><div className="mt-1 text-sm text-slate-600">{p.pa_tipo?.trim() || "—"}</div><span className={`mt-3 inline-block rounded-full px-2 py-1 text-xs ${p.pa_ecto_endo?.trim().toLowerCase() === "ecto" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{p.pa_ecto_endo?.trim()}</span></div>)}{(!data || data.length === 0) && <p className="rounded-xl border bg-white p-8 text-center text-slate-400">Sin parásitos importados.</p>}</div></div>;
}
