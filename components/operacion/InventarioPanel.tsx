"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Producto = { id: number; nombre: string; categoria: string; stock: number; stock_minimo: number; precio: number | string; proveedor?: string | null; vencimiento?: string | null };

export function InventarioPanel({ productos }: { productos: Producto[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const res = await fetch("/api/inventario", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) return setError((await res.json()).error ?? "No se pudo guardar");
    event.currentTarget.reset(); router.refresh();
  };
  const remove = async (id: number) => {
    if (!confirm("¿Eliminar este producto? Las ventas existentes no se eliminan.")) return;
    const res = await fetch(`/api/inventario/${id}`, { method: "DELETE" });
    if (!res.ok) return setError((await res.json()).error ?? "No se pudo eliminar");
    router.refresh();
  };
  return <div className="space-y-5">
    <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-white border rounded-xl p-4">
      <Input name="nombre" placeholder="Producto" required />
      <Input name="categoria" placeholder="Categoría" required />
      <Input name="stock" type="number" min="0" defaultValue="0" required />
      <Input name="stock_minimo" type="number" min="0" defaultValue="0" required />
      <Input name="precio" type="number" min="0" step="0.01" defaultValue="0" required />
      <Input name="proveedor" placeholder="Proveedor" />
      <Input name="vencimiento" type="date" />
      <Button type="submit">Agregar producto</Button>
      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
    </form>
    <div className="bg-white border rounded-xl overflow-hidden">
      <table className="w-full text-sm"><thead className="bg-slate-50 text-left text-slate-600"><tr><th className="p-3">Producto</th><th>Stock</th><th>Mínimo</th><th>Precio</th><th></th></tr></thead>
      <tbody>{productos.map((p) => <tr key={p.id} className="border-t"><td className="p-3"><b>{p.nombre}</b><span className="block text-xs text-slate-500">{p.categoria}{p.proveedor ? ` · ${p.proveedor}` : ""}</span></td><td className={p.stock <= p.stock_minimo ? "text-amber-700 font-semibold" : ""}>{p.stock}</td><td>{p.stock_minimo}</td><td>${Number(p.precio).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td><td><Button variant="destructive" size="xs" onClick={() => remove(p.id)}>Eliminar</Button></td></tr>)}</tbody></table>
      {productos.length === 0 && <p className="p-8 text-center text-slate-400">Todavía no hay productos.</p>}
    </div>
  </div>;
}
