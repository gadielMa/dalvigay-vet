import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LogoutButton from "./LogoutButton";
import { MobileNav } from "./MobileNav";
import { QuickActions } from "./QuickActions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const nav = [
    { href: "/dashboard", label: "🏠 Inicio" },
    { href: "/dashboard/buscar", label: "🔎 Buscar" },
    { href: "/dashboard/turnos", label: "🗓️ Turnos" },
    { href: "/dashboard/clientes", label: "👥 Clientes" },
    { href: "/dashboard/pacientes", label: "🐾 Pacientes" },
    { href: "/dashboard/historia-clinica", label: "📋 Historia Clínica" },
    { href: "/dashboard/vacunas", label: "💉 Vacunas" },
    { href: "/dashboard/vacunas/recordatorios", label: "📧 Recordatorios" },
    { href: "/dashboard/ecografias", label: "🔬 Ecografías" },
    { href: "/dashboard/estudios", label: "🔎 Estudios generales" },
    { href: "/dashboard/electrocardio", label: "❤️ Electrocardiogramas" },
    { href: "/dashboard/analisis", label: "🧪 Análisis" },
    { href: "/dashboard/parasitos", label: "🪱 Parásitos" },
    { href: "/dashboard/ectoendo", label: "🪱 Tratamientos" },
    { href: "/dashboard/rayos", label: "☢️ Rayos X" },
    { href: "/dashboard/inventario", label: "📦 Inventario" },
    { href: "/dashboard/ventas", label: "💳 Ventas" },
    { href: "/dashboard/comunicaciones", label: "✉️ Comunicaciones" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-100/70">
      <MobileNav items={nav} nombre={session.nombre} />
      <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b bg-slate-50 px-6 md:flex">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight text-slate-800">🐾 Dalvigay <span className="text-xs font-medium text-slate-500">Veterinaria</span></Link>
        <div className="flex items-center gap-4"><Link href="/dashboard" className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">⌂ Inicio</Link><span className="text-sm text-slate-600">👤 {session.nombre} · {session.permiso === "777" ? "Admin" : "Usuario"}</span><LogoutButton compact /></div>
      </header>
      <div className="flex flex-1">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-slate-50 md:flex">
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
      </aside>

      {/* Main */}
      <main className="min-w-0 flex-1 overflow-auto p-4 pb-24 sm:p-6 md:pb-6">{children}</main><QuickActions />
      </div>
      <footer className="border-t bg-slate-100 px-4 py-5 text-center text-xs text-slate-500">Hecho por <a href="https://www.instagram.com/induliru.tech/" target="_blank" rel="noreferrer" className="font-semibold text-slate-700 hover:text-slate-950 hover:underline">Induliru</a></footer>
    </div>
  );
}
