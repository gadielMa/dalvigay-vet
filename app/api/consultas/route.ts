import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/operacion";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try { const session = await requireSession(); const b = await req.json(); const paciente_id = Number(b.paciente_id); const titulo = String(b.titulo ?? "").trim(); const detalle = String(b.detalle ?? "").trim(); if (!Number.isInteger(paciente_id) || !titulo || !detalle) return NextResponse.json({ error: "Completá título y detalle" }, { status: 400 }); const n = (v: unknown) => v === "" || v == null ? null : Number(v); const { data, error } = await createAdminClient().from("consultas_nuevas").insert({ paciente_id, fecha: b.fecha || new Date().toISOString().slice(0,10), titulo, detalle, tratamiento: String(b.tratamiento ?? "").trim() || null, profesional: String(b.profesional ?? "").trim() || null, peso: n(b.peso), temperatura: n(b.temperatura), creado_por: session.nombre }).select().single(); if (error) throw error; return NextResponse.json(data, { status: 201 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo guardar la consulta" }, { status: 500 }); }
}
