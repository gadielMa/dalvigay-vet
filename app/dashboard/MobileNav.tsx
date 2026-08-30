"use client";

import Link from "next/link";
import { useState } from "react";

export type NavItem = { href: string; label: string };

export function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-white px-4 py-3 md:hidden">
        <div className="text-lg font-bold tracking-tight text-slate-800">🐾 Dalvigay</div>
        <button type="button" onClick={() => setOpen(!open)} aria-label="Abrir menú" className="rounded-md border px-3 py-1.5 text-xl leading-none text-slate-700">
          {open ? "×" : "☰"}
        </button>
      </header>
      {open && <div className="fixed inset-0 z-40 bg-slate-900/30 md:hidden" onClick={() => setOpen(false)} />}
      <nav className={`fixed inset-y-0 right-0 z-50 w-[min(85vw,18rem)] transform bg-white p-4 shadow-xl transition-transform md:hidden ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="mb-4 flex items-center justify-between border-b pb-3"><span className="font-semibold text-slate-800">Menú</span><button type="button" onClick={() => setOpen(false)} aria-label="Cerrar menú">×</button></div>
        <div className="space-y-1">
          {items.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="block rounded-md px-3 py-3 text-slate-700 hover:bg-slate-100">{item.label}</Link>)}
        </div>
      </nav>
    </>
  );
}
