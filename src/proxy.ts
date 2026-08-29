import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  const isPublicPath =
    path === "/login" ||
    path === "/manifest.webmanifest" ||
    path === "/favicon.ico";

  if (!session && !isPublicPath) {
    if (path.startsWith("/api/")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && path === "/login") {
    return NextResponse.redirect(
      new URL(session.role === "admin" ? "/admin" : "/marketplace", request.url),
    );
  }

  if (path.startsWith("/admin") && session?.role !== "admin") {
    return NextResponse.redirect(new URL("/marketplace", request.url));
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
