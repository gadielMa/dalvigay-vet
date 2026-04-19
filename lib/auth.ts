import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dalvigay-vet-secret-change-in-prod",
);
const COOKIE = "dv_session";

export type SessionUser = {
  id: number;
  nombre: string;
  permiso: string;
};

export async function login(
  nombre: string,
  pass: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { data: user, error } = await supabase
    .from("ta_usuarios")
    .select("usr_id, usr_nombre, usr_pass, usr_numper")
    .eq("usr_nombre", nombre)
    .single();

  if (error || !user) return { ok: false, error: "Usuario no encontrado" };

  const storedPass: string = user.usr_pass;
  let valid = false;

  if (storedPass.startsWith("$2")) {
    valid = await bcrypt.compare(pass, storedPass);
  } else {
    // plaintext legacy — compare then upgrade
    valid = pass === storedPass;
    if (valid) {
      const hash = await bcrypt.hash(pass, 12);
      await supabase
        .from("ta_usuarios")
        .update({ usr_pass: hash })
        .eq("usr_id", user.usr_id);
    }
  }

  if (!valid) return { ok: false, error: "Contraseña incorrecta" };

  const token = await new SignJWT({
    id: user.usr_id,
    nombre: user.usr_nombre,
    permiso: user.usr_numper,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("12h")
    .sign(SECRET);

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 12,
    path: "/",
  });

  return { ok: true };
}

export async function logout() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}
