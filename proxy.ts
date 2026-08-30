import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

function authSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Falta configurar AUTH_SECRET");
  return new TextEncoder().encode(secret);
}

const PUBLIC_PREFIXES = ["/login", "/api/auth", "/_next", "/favicon.ico"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("dv_session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  try {
    await jwtVerify(token, authSecret());
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
