import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/login")
  ) {
    return NextResponse.next();
  }

  const requiredPassword = process.env.ACCESS_PASSWORD;
  if (!requiredPassword) {
    return NextResponse.json(
      { error: "ACCESS_PASSWORD is not configured" },
      { status: 500 }
    );
  }

  const current = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!current || !(await verifyAuthToken(current, requiredPassword))) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api).*)"],
};
