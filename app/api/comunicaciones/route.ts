import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { escapeHtml, requireSession } from "@/lib/operacion";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { cliente_id, asunto, mensaje } = await req.json();
    const clientId = Number(cliente_id);
    const subject = String(asunto ?? "").trim();
    const message = String(mensaje ?? "").trim();
    if (!Number.isInteger(clientId) || !subject || !message) {
      return NextResponse.json({ error: "Completá cliente, asunto y mensaje" }, { status: 400 });
    }
    const supabase = createAdminClient();
    const { data: client, error: clientError } = await supabase
      .from("clientes").select("cli_id, cli_nombre, cli_apellido, cli_mail").eq("cli_id", clientId).single();
    if (clientError || !client?.cli_mail || client.cli_mail === "0") {
      return NextResponse.json({ error: "El cliente no tiene un email válido" }, { status: 400 });
    }
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) throw new Error("Falta configurar RESEND_API_KEY");
    const name = `${client.cli_nombre?.trim() ?? ""} ${client.cli_apellido?.trim() ?? ""}`.trim() || "cliente";
    const { error: sendError } = await new Resend(resendKey).emails.send({
      from: "Veterinaria Dalvigay <recordatorios@mail.dalvigay.com.ar>",
      to: client.cli_mail,
      subject,
      html: `<p>Hola ${escapeHtml(name)},</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p><p>Veterinaria Dalvigay</p>`,
    });
    if (sendError) throw new Error(sendError.message);
    const { error: logError } = await supabase.from("comunicaciones").insert({
      cliente_id: clientId, tipo: "email", asunto: subject, mensaje: message, enviado_por: session.nombre,
    });
    if (logError) throw logError;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo enviar el email" }, { status: 500 });
  }
}
