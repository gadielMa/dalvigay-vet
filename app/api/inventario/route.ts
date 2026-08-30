import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/operacion";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    await requireSession();
    const { data, error } = await createAdminClient()
      .from("inventario")
      .select("*")
      .order("nombre");
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error al consultar inventario" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession();
    const body = await req.json();
    const nombre = String(body.nombre ?? "").trim();
    const categoria = String(body.categoria ?? "").trim();
    const stock = Number(body.stock ?? 0);
    const stockMinimo = Number(body.stock_minimo ?? 0);
    const precio = Number(body.precio ?? 0);
    if (!nombre || !categoria || !Number.isInteger(stock) || !Number.isInteger(stockMinimo) || stock < 0 || stockMinimo < 0 || !Number.isFinite(precio) || precio < 0) {
      return NextResponse.json({ error: "Datos de inventario inválidos" }, { status: 400 });
    }
    const { data, error } = await createAdminClient().from("inventario").insert({
      nombre, categoria, stock, stock_minimo: stockMinimo, precio,
      vencimiento: body.vencimiento || null,
      proveedor: String(body.proveedor ?? "").trim() || null,
      codigo_barras: String(body.codigo_barras ?? "").trim() || null,
    }).select().single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo crear el producto" }, { status: 500 });
  }
}
