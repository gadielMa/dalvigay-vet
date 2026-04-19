import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { nombre, pass } = await req.json();
  if (!nombre || !pass) {
    return NextResponse.json({ ok: false, error: "Datos incompletos" }, { status: 400 });
  }
  const result = await login(nombre, pass);
  return NextResponse.json(result, { status: result.ok ? 200 : 401 });
}
