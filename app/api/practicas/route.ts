import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/operacion";
import { createAdminClient } from "@/lib/supabase/admin";
import { argentinaDate } from "@/lib/date";

const config = {
  ecografia: { table: "ecografias", id: "eco_id", patient: "eco_idpaciente", date: "eco_fecha", doctor: "eco_dr", title: "eco_estudio", detail: "eco_diag" },
  rayos: { table: "rayos", id: "ray_id", patient: "ray_idpaciente", date: "ray_fvisita", doctor: "ray_dr", title: "ray_estudio", detail: "ray_diag" },
  hemograma: { table: "hemogramas", id: "hem_id", patient: "hem_idpaciente", date: "hem_fvisita", doctor: "hem_dr", title: "hem_observaciones", detail: "hem_observaciones" },
  orina: { table: "orina", id: "ori_id", patient: "ori_idpaciente", date: "ori_fecha", doctor: "ori_dr", title: "ori_observaciones", detail: "ori_observaciones" },
  quimica: { table: "quimicasang", id: "qs_id", patient: "qs_idpaciente", date: "qs_fvisita", doctor: "qs_dr", title: "qs_observaciones", detail: "qs_observaciones" },
} as const;

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(); const body = await req.json(); const type = body.tipo as keyof typeof config; const selected = config[type]; const patientId = Number(body.paciente_id);
    if (!selected || !Number.isInteger(patientId)) return NextResponse.json({ error: "Práctica o paciente inválido" }, { status: 400 });
    const supabase = createAdminClient(); const { data: last } = await supabase.from(selected.table).select(selected.id).order(selected.id, { ascending: false }).limit(1).maybeSingle();
    const title = String(body.titulo ?? "").trim(); const detail = String(body.detalle ?? "").trim();
    if (!title && !detail) return NextResponse.json({ error: "Completá el estudio o el detalle" }, { status: 400 });
    const record: Record<string, unknown> = { [selected.id]: Number((last as Record<string, unknown> | null)?.[selected.id] ?? 0) + 1, [selected.patient]: patientId, [selected.date]: String(body.fecha || argentinaDate()), [selected.doctor]: String(body.dr || session.nombre).trim(), [selected.title]: title || type, [selected.detail]: detail };
    const { data, error } = await supabase.from(selected.table).insert(record).select().single(); if (error) throw error; return NextResponse.json(data, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo guardar la práctica" }, { status: 500 }); }
}
