import { NextRequest, NextResponse } from "next/server";
import { argentinaDate } from "@/lib/date";
import { requireSession } from "@/lib/operacion";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const pacienteId = Number(body.paciente_id);
    const titulo = String(body.titulo ?? "").trim();
    const detalle = String(body.detalle ?? "").trim();
    if (!Number.isInteger(pacienteId) || !titulo || !detalle) return NextResponse.json({ error: "Completá título y detalle" }, { status: 400 });
    const adjuntos = Array.isArray(body.adjuntos)
      ? body.adjuntos.filter((file: { path?: unknown }) => typeof file?.path === "string" && /^\d+\/[a-f0-9-]+\.[a-z0-9]+$/i.test(file.path)).slice(0, 5)
      : [];
    const numberOrNull = (value: unknown) => value === "" || value == null ? null : Number(value);
    const { data, error } = await createAdminClient().from("consultas_nuevas").insert({
      paciente_id: pacienteId, fecha: body.fecha || argentinaDate(), titulo, detalle,
      tratamiento: String(body.tratamiento ?? "").trim() || null, profesional: String(body.profesional ?? "").trim() || null,
      peso: numberOrNull(body.peso), temperatura: numberOrNull(body.temperatura), adjuntos, creado_por: session.nombre,
    }).select().single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo guardar la consulta" }, { status: 500 }); }
}
