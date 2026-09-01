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

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/inventario/[id]">) {
  try {
    await requireSession(); const { id } = await ctx.params; const productId = Number(id); const body = await req.json();
    const nombre=String(body.nombre??"").trim(), categoria=String(body.categoria??"").trim(), stock=Number(body.stock), stock_minimo=Number(body.stock_minimo), precio=Number(body.precio);
    if(!Number.isInteger(productId)||!nombre||!categoria||!Number.isInteger(stock)||stock<0||!Number.isInteger(stock_minimo)||stock_minimo<0||!Number.isFinite(precio)||precio<0)return NextResponse.json({error:"Datos de inventario inválidos"},{status:400});
    const {data,error}=await createAdminClient().from("inventario").update({nombre,categoria,stock,stock_minimo,precio,vencimiento:body.vencimiento||null,proveedor:String(body.proveedor??"").trim()||null,codigo_barras:String(body.codigo_barras??"").trim()||null,actualizado_en:new Date().toISOString()}).eq("id",productId).select().single();
    if(error)throw error;return NextResponse.json(data);
  } catch(error){return NextResponse.json({error:error instanceof Error?error.message:"No se pudo actualizar"},{status:500});}
}
