import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/operacion";
import { createAdminClient } from "@/lib/supabase/admin";
export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/pacientes/[id]">) {
  try { await requireSession(); const { id } = await ctx.params; const body = await req.json(); const allowed = ["pac_nombre","pac_apellido","pac_fecha_nac","pac_raz_nombre","pac_raz_siglas","pac_raz_esp","pac_sexo","pac_color","pac_peso","pac_microchip","pac_obser","pac_fecha_des"]; const update: Record<string,string> = {}; for (const key of allowed) if (key in body) update[key] = String(body[key] ?? "").trim(); if (update.pac_nombre || update.pac_apellido) update.pac_nomcomp = `${update.pac_nombre ?? ""} ${update.pac_apellido ?? ""}`.trim(); update.pac_ultima_modificacion = new Date().toISOString().slice(0,10); const { error } = await createAdminClient().from("pacientes").update(update).eq("pac_id", Number(id)); if (error) throw error; return NextResponse.json({ok:true}); }
  catch(error) { return NextResponse.json({error:error instanceof Error?error.message:"No se pudo actualizar"},{status:500}); }
}
