import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/operacion";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "archivos-pacientes";
const validPath = (path: string) => /^\d+\/[a-f0-9-]+\.[a-z0-9]+$/i.test(path);

export async function POST(req: NextRequest) {
  try {
    await requireSession();
    const data = await req.formData();
    const patientId = Number(data.get("paciente_id"));
    const file = data.get("archivo");
    if (!Number.isInteger(patientId) || !(file instanceof File)) return NextResponse.json({ error: "Archivo inválido" }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "El archivo no puede superar 8 MB" }, { status: 400 });
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") return NextResponse.json({ error: "Solo se permiten imágenes o PDF" }, { status: 400 });
    const ext = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
    const path = `${patientId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await createAdminClient().storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    return NextResponse.json({ path, nombre: file.name, tipo: file.type }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo subir el archivo" }, { status: 500 }); }
}

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const path = req.nextUrl.searchParams.get("path") ?? "";
    if (!validPath(path)) return NextResponse.json({ error: "Archivo inválido" }, { status: 400 });
    const { data, error } = await createAdminClient().storage.from(BUCKET).download(path);
    if (error || !data) throw error ?? new Error("Archivo no encontrado");
    return new NextResponse(data, { headers: { "Content-Type": data.type || "application/octet-stream", "Content-Disposition": "inline" } });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo descargar el archivo" }, { status: 404 }); }
}
