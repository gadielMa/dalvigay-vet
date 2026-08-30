import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/operacion";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/inventario/[id]">) {
  try {
    await requireSession();
    const { id } = await ctx.params;
    const productId = Number(id);
    if (!Number.isInteger(productId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    const { error } = await createAdminClient().from("inventario").delete().eq("id", productId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo eliminar el producto" }, { status: 500 });
  }
}
