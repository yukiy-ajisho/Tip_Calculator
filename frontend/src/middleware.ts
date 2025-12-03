import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // パス名をヘッダーに追加（レイアウトで使用）
  res.headers.set("x-pathname", req.nextUrl.pathname);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookies) {
          try {
            cookies.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            );
          } catch {
            // ignore setAll errors in middleware
          }
        },
      },
    }
  );

  // ルートパス（/）の処理
  if (req.nextUrl.pathname === "/") {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const url = req.nextUrl.clone();
    if (user) {
      // 認証済みの場合は/tipにリダイレクト
      url.pathname = "/tip";
    } else {
      // 未認証の場合は/loginにリダイレクト
      url.pathname = "/login";
    }
    url.search = "";
    return NextResponse.redirect(url);
  }

  // 保護されたルートをチェック
  const protectedPaths = ["/records", "/settings", "/tip"];
  const isProtectedPath = protectedPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/",
    "/records",
    "/records/:path*",
    "/settings",
    "/settings/:path*",
    "/tip",
    "/tip/:path*",
    "/login",
  ],
};
