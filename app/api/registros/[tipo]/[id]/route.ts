import { NextResponse } from "next/server";
import { requireSession } from "@/lib/operacion";
import { createAdminClient } from "@/lib/supabase/admin";

const config = { vacuna: { table: "vacunas", id: "vac_id" }, estudio: { table: "estudios", id: "est_id" }, electro: { table: "electrocardio", id: "ele_id" }, ectoendo: { table: "ectoendo", id: "ee_id" } } as const;
export async function DELETE(_request: Request, { params }: { params: Promise<{ tipo: string; id: string }> }) {
  try {
    await requireSession(); const { tipo, id: rawId } = await params; const selected = config[tipo as keyof typeof config]; const id = Number(rawId);
    if (!selected || !Number.isInteger(id)) return NextResponse.json({ error: "Registro inválido" }, { status: 400 });
    const { error } = await createAdminClient().from(selected.table).delete().eq(selected.id, id); if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo eliminar el registro" }, { status: 500 }); }
}
