import { NextResponse } from "next/server";
import { requireSession } from "@/lib/operacion";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(_request: Request, ctx: RouteContext<"/api/clientes/[id]/archivar">) {
  try {
    await requireSession();
    const { id: rawId } = await ctx.params;
    const id = Number(rawId);
    if (!Number.isInteger(id)) return NextResponse.json({ error: "Cliente inválido" }, { status: 400 });

    const supabase = createAdminClient();
    const { data: cliente, error: findError } = await supabase.from("clientes").select("cli_archivado").eq("cli_id", id).single();
    if (findError) throw findError;
    const { error } = await supabase.from("clientes").update({ cli_archivado: !cliente.cli_archivado }).eq("cli_id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true, archivado: !cliente.cli_archivado });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo actualizar el cliente" }, { status: 500 });
  }
}
