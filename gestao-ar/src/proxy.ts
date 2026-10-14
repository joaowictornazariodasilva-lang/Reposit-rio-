import { NextResponse, type NextRequest } from "next/server";

/*
 * Barreira rápida: sem cookie de sessão, vai para o login. A verificação real
 * (assinatura, usuário ativo, perfil) acontece no servidor em cada página/ação.
 */
const PUBLICAS = ["/login", "/api/health"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLICAS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();
  if (!req.cookies.has("sessao")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/" ? "" : `?de=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon|icon|manifest|.*\\.(?:svg|png|jpg|webp|ico|txt)$).*)"],
};
