import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const LANGS = ["en", "th", "cn", "ja", "ko", "de", "fr", "ru"];
const DEFAULT_LANG = "en";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Backoffice auth guard ──────────────────────────────────────────────────
  if (pathname.startsWith("/backoffice") && !pathname.startsWith("/backoffice/login")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET ?? "change-this-in-production",
    });
    if (!token) {
      const loginUrl = new URL("/backoffice/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── Skip i18n for backoffice paths (they don't use lang prefix) ─────────────
  if (pathname.startsWith("/backoffice")) {
    return NextResponse.next();
  }

  // ── i18n: redirect paths without a lang prefix ────────────────────────────
  const firstSegment = pathname.split("/")[1];
  if (!LANGS.includes(firstSegment)) {
    const acceptLang = request.headers.get("accept-language") || "";
    const preferred = acceptLang.split(",")[0].split("-")[0].toLowerCase();
    const lang = LANGS.includes(preferred) ? preferred : DEFAULT_LANG;

    const url = request.nextUrl.clone();
    url.pathname = `/${lang}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/backoffice",
    "/backoffice/((?!login).*)",
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};
