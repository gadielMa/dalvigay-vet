import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/operacion";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { items, notas = "" } = await req.json();
    if (!Array.isArray(items) || items.length === 0 || items.some((item) => !Number.isInteger(Number(item.producto_id)) || !Number.isInteger(Number(item.cantidad)) || Number(item.cantidad) < 1)) {
      return NextResponse.json({ error: "Los ítems de la venta son inválidos" }, { status: 400 });
    }
    const { data, error } = await createAdminClient().rpc("registrar_venta", {
      p_items: items.map((item) => ({ producto_id: Number(item.producto_id), cantidad: Number(item.cantidad) })),
      p_veterinario_nombre: session.nombre,
      p_notas: String(notas).slice(0, 2000),
    });
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo registrar la venta" }, { status: 500 });
  }
}
