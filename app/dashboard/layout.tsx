import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LogoutButton from "./LogoutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const nav = [
    { href: "/dashboard", label: "🏠 Inicio" },
    { href: "/dashboard/clientes", label: "👥 Clientes" },
    { href: "/dashboard/pacientes", label: "🐾 Pacientes" },
    { href: "/dashboard/historia-clinica", label: "📋 Historia Clínica" },
    { href: "/dashboard/vacunas", label: "💉 Vacunas" },
    { href: "/dashboard/ecografias", label: "🔬 Ecografías" },
    { href: "/dashboard/analisis", label: "🧪 Análisis" },
    { href: "/dashboard/rayos", label: "☢️ Rayos X" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r flex flex-col shrink-0">
        <div className="px-4 py-5 border-b">
          <div className="text-2xl font-bold text-slate-800 tracking-tight">🐾 Dalvigay</div>
          <div className="text-xs text-slate-500 mt-0.5">Veterinaria</div>
        </div>
        <nav className="flex-1 py-3 space-y-0.5 px-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t">
          <div className="text-xs text-slate-500 mb-2">
            {session.nombre} · {session.permiso === "777" ? "Admin" : "Usuario"}
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
