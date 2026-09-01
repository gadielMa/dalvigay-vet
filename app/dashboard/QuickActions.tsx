"use client";
import Link from "next/link";
export function QuickActions() { return <div className="fixed bottom-4 right-4 z-20 flex gap-2 md:hidden"><Link href="/dashboard/turnos" className="rounded-full bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">🗓️ Turno</Link><Link href="/dashboard/buscar" className="rounded-full bg-blue-700 px-4 py-3 text-sm font-medium text-white shadow-lg">🔎 Buscar</Link></div>; }
