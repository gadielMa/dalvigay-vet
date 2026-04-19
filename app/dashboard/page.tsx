import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getSession();
  const supabase = createAdminClient();

  const [
    { count: clientes },
    { count: pacientes },
    { count: vacunas },
    { count: hc },
    { count: ecografias },
  ] = await Promise.all([
    supabase.from("clientes").select("*", { count: "exact", head: true }),
    supabase.from("pacientes").select("*", { count: "exact", head: true }),
    supabase.from("vacunas").select("*", { count: "exact", head: true }),
    supabase.from("hccab").select("*", { count: "exact", head: true }),
    supabase.from("ecografias").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Clientes", value: clientes?.toLocaleString("es-AR"), icon: "👥" },
    { label: "Pacientes", value: pacientes?.toLocaleString("es-AR"), icon: "🐾" },
    { label: "Vacunas", value: vacunas?.toLocaleString("es-AR"), icon: "💉" },
    { label: "Historias Clínicas", value: hc?.toLocaleString("es-AR"), icon: "📋" },
    { label: "Ecografías", value: ecografias?.toLocaleString("es-AR"), icon: "🔬" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-1">
        Bienvenido, {session?.nombre}
      </h1>
      <p className="text-sm text-slate-500 mb-6">Panel principal · Veterinaria Dalvigay</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border px-4 py-5 flex flex-col gap-1 shadow-sm"
          >
            <div className="text-2xl">{s.icon}</div>
            <div className="text-2xl font-bold text-slate-800">{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
