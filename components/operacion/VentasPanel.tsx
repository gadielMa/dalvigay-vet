"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Producto = { id: number; nombre: string; stock: number; precio: number | string };

export function VentasPanel({ productos }: { productos: Producto[] }) {
  const router = useRouter(); const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    const form = new FormData(event.currentTarget);
    const producto_id = Number(form.get("producto_id")); const cantidad = Number(form.get("cantidad"));
    const res = await fetch("/api/ventas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: [{ producto_id, cantidad }], notas: form.get("notas") }) });
    if (!res.ok) return setError((await res.json()).error ?? "No se pudo registrar la venta");
    event.currentTarget.reset(); router.refresh();
  };
  return <form onSubmit={submit} className="grid md:grid-cols-4 gap-2 bg-white border rounded-xl p-4">
    <select name="producto_id" className="h-8 rounded-lg border border-input px-2.5 text-sm" required defaultValue="">
      <option value="" disabled>Elegí un producto</option>{productos.filter((p) => p.stock > 0).map((p) => <option key={p.id} value={p.id}>{p.nombre} · stock {p.stock} · ${Number(p.precio).toLocaleString("es-AR")}</option>)}
    </select>
    <Input name="cantidad" type="number" min="1" defaultValue="1" required />
    <Input name="notas" placeholder="Notas (opcional)" />
    <Button type="submit">Registrar venta</Button>
    {error && <p className="md:col-span-4 text-sm text-red-600">{error}</p>}
  </form>;
}
