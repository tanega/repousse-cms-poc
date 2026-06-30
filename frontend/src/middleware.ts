import { jwtVerify, createRemoteJWKSet } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const HANKO_API_URL = process.env.NEXT_PUBLIC_HANKO_API_URL ?? "http://localhost:8000";

const PUBLIC_PATHS = ["/", "/auth/login", "/auth/register", "/api/webhooks"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("hanko")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  try {
    const JWKS = createRemoteJWKSet(new URL(`${HANKO_API_URL}/.well-known/jwks.json`));
    await jwtVerify(token, JWKS);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
