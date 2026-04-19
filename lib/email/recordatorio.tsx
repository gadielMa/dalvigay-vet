import { Resend } from "resend";

export type RecordatorioData = {
  toEmail: string;
  toNombre: string;
  mascotaNombre: string;
  mascotaEspecie: string;
  vacunaMarca: string;
  vacunaClase: string;
  fechaProxima: string;
};

export async function enviarRecordatorio(data: RecordatorioData) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const espEmoji: Record<string, string> = { C: "🐶", F: "🐱", AVE: "🐦" };
  const emoji = espEmoji[data.mascotaEspecie] ?? "🐾";

  const { error } = await resend.emails.send({
    from: "Veterinaria Dalvigay <recordatorios@dalvigay.com.ar>",
    to: data.toEmail,
    subject: `${emoji} Recordatorio de vacuna para ${data.mascotaNombre}`,
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"></head>
      <body style="font-family: sans-serif; background: #f8fafc; margin: 0; padding: 24px;">
        <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="background: #0f172a; padding: 24px; text-align: center;">
            <div style="font-size: 40px;">${emoji}</div>
            <h1 style="color: white; font-size: 20px; margin: 8px 0 0;">Veterinaria Dalvigay</h1>
          </div>
          <div style="padding: 28px;">
            <p style="color: #475569; margin: 0 0 16px;">Hola <strong>${data.toNombre}</strong>,</p>
            <p style="color: #475569; margin: 0 0 24px;">
              Te recordamos que <strong>${data.mascotaNombre}</strong> tiene pendiente la siguiente vacuna:
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <table style="width: 100%; font-size: 14px; color: #334155;">
                <tr>
                  <td style="padding: 4px 0; color: #94a3b8;">Vacuna</td>
                  <td style="padding: 4px 0; font-weight: 600;">${data.vacunaMarca || "—"}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #94a3b8;">Clase</td>
                  <td style="padding: 4px 0;">${data.vacunaClase || "—"}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #94a3b8;">Fecha sugerida</td>
                  <td style="padding: 4px 0; font-weight: 600; color: #d97706;">${data.fechaProxima}</td>
                </tr>
              </table>
            </div>
            <p style="color: #64748b; font-size: 13px;">
              Comunicate con nosotros para coordinar el turno.<br>
              Veterinaria Dalvigay · Buenos Aires
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  if (error) throw new Error(error.message);
  return true;
}
