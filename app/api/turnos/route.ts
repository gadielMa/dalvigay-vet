import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/operacion";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const date = req.nextUrl.searchParams.get("fecha");
    let query = createAdminClient().from("turnos").select("*").order("fecha").order("hora");
    if (date) query = query.eq("fecha", date);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Error al consultar turnos" }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const fecha = String(body.fecha ?? ""); const hora = String(body.hora ?? "");
    const clienteId = Number(body.cliente_id); const pacienteId = Number(body.paciente_id);
    const motivo = String(body.motivo ?? "").trim();
    const estados = ["pendiente", "confirmado", "atendido", "cancelado"];
    const estado = estados.includes(body.estado) ? body.estado : "pendiente";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}/.test(hora) || !Number.isInteger(clienteId) || !Number.isInteger(pacienteId) || !motivo) return NextResponse.json({ error: "Completá fecha, hora, cliente, mascota y motivo" }, { status: 400 });
    const supabase = createAdminClient();
    const { data: patient, error: patientError } = await supabase.from("pacientes").select("pac_cliente").eq("pac_id", pacienteId).maybeSingle();
    if (patientError || !patient || Number(patient.pac_cliente) !== clienteId) return NextResponse.json({ error: "La mascota no corresponde al dueño seleccionado" }, { status: 400 });
    const { data: duplicate, error: duplicateError } = await supabase.from("turnos").select("id").eq("paciente_id", pacienteId).eq("fecha", fecha).eq("hora", hora).neq("estado", "cancelado").limit(1).maybeSingle();
    if (duplicateError) throw duplicateError;
    if (duplicate) return NextResponse.json({ error: "Ya existe un turno para esta mascota en esa fecha y hora" }, { status: 409 });
    const { data, error } = await supabase.from("turnos").insert({ fecha, hora, cliente_id: clienteId, paciente_id: pacienteId, motivo, estado, notas: String(body.notas ?? "").trim() || null, creado_por: session.nombre }).select().single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo crear el turno" }, { status: 500 }); }
}
