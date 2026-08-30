import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/operacion";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/turnos/[id]">) {
  try { await requireSession(); const { id } = await ctx.params; const estado = String((await req.json()).estado ?? ""); if (!["pendiente","confirmado","atendido","cancelado"].includes(estado)) return NextResponse.json({ error: "Estado inválido" }, { status: 400 }); const { error } = await createAdminClient().from("turnos").update({ estado, actualizado_en: new Date().toISOString() }).eq("id", Number(id)); if (error) throw error; return NextResponse.json({ ok: true }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo actualizar" }, { status: 500 }); }
}
