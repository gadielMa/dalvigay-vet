import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarRecordatorio } from "@/lib/email/recordatorio";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { vac_id } = await req.json();
  if (!vac_id) return NextResponse.json({ error: "Falta vac_id" }, { status: 400 });

  const supabase = createAdminClient();

  const { data: vac } = await supabase
    .from("vacunas")
    .select("vac_idpaciente, vac_idcliente, vac_marca, vac_clase, vac_fproxima")
    .eq("vac_id", vac_id)
    .single();

  if (!vac) return NextResponse.json({ error: "Vacuna no encontrada" }, { status: 404 });

  const { data: paciente } = await supabase
    .from("pacientes")
    .select("pac_nombre, pac_raz_siglas")
    .eq("pac_id", vac.vac_idpaciente)
    .single();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("cli_nombre, cli_apellido, cli_mail")
    .eq("cli_id", vac.vac_idcliente)
    .single();

  if (!cliente?.cli_mail || cliente.cli_mail === "0") {
    return NextResponse.json({ error: "El cliente no tiene email registrado" }, { status: 400 });
  }

  await enviarRecordatorio({
    toEmail: cliente.cli_mail,
    toNombre: `${cliente.cli_nombre?.trim()} ${cliente.cli_apellido?.trim()}`,
    mascotaNombre: paciente?.pac_nombre?.trim() ?? "su mascota",
    mascotaEspecie: paciente?.pac_raz_siglas?.trim() ?? "",
    vacunaMarca: vac.vac_marca ?? "",
    vacunaClase: vac.vac_clase ?? "",
    fechaProxima: vac.vac_fproxima ?? "",
  });

  return NextResponse.json({ ok: true });
}
