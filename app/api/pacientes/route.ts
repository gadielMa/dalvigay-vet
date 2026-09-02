import { NextRequest, NextResponse } from "next/server";
import { argentinaDate } from "@/lib/date";
import { requireSession } from "@/lib/operacion";
import { createAdminClient } from "@/lib/supabase/admin";

const text = (value: unknown) => String(value ?? "").trim();

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const clientId = Number(req.nextUrl.searchParams.get("cliente_id"));
    const queryText = text(req.nextUrl.searchParams.get("q")).replace(/[,%()]/g, " ");
    if (!Number.isInteger(clientId)) return NextResponse.json({ error: "Falta cliente_id" }, { status: 400 });
    let query = createAdminClient().from("pacientes").select("pac_id,pac_nombre,pac_cliente,pac_raz_nombre").eq("pac_cliente", clientId).order("pac_nombre").limit(100);
    if (queryText) query = query.ilike("pac_nombre", `%${queryText}%`);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudieron buscar mascotas" }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession();
    const body = await req.json();
    const nombre = text(body.pac_nombre);
    const cliente = Number(body.pac_cliente);
    if (!nombre || !Number.isInteger(cliente)) return NextResponse.json({ error: "Nombre y dueño son obligatorios" }, { status: 400 });
    const supabase = createAdminClient();
    const { data: last } = await supabase.from("pacientes").select("pac_id").order("pac_id", { ascending: false }).limit(1).maybeSingle();
    const apellido = text(body.pac_apellido);
    const now = argentinaDate();
    const record = {
      pac_id: Number(last?.pac_id ?? 0) + 1, pac_nombre: nombre, pac_apellido: apellido,
      pac_nomcomp: `${nombre} ${apellido}`.trim(), pac_fecha_nac: text(body.pac_fecha_nac),
      pac_raz_id: Number(body.pac_raz_id) || 0, pac_raz_esp: text(body.pac_raz_esp) || "C",
      pac_raz_siglas: text(body.pac_raz_siglas) || "C", pac_raz_nombre: text(body.pac_raz_nombre) || "Indefinido",
      pac_sexo: text(body.pac_sexo), pac_color: text(body.pac_color), pac_peso: text(body.pac_peso),
      pac_foto: "", pac_cliente: cliente, pac_obser: text(body.pac_obser), pac_fecha_alta: now,
      pac_ultima_modificacion: now, pac_fecha_des: "Vive", pac_microchip: text(body.pac_microchip), pac_idpaciente: "",
    };
    const { data, error } = await supabase.from("pacientes").insert(record).select().single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo crear la mascota" }, { status: 500 }); }
}
