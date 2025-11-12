import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

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

  // Basic authentication check
  if (
    req.nextUrl.pathname.startsWith("/records") ||
    req.nextUrl.pathname.startsWith("/settings") ||
    req.nextUrl.pathname.startsWith("/tip")
  ) {
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
    "/records",
    "/records/:path*",
    "/settings",
    "/settings/:path*",
    "/tip",
    "/tip/:path*",
  ],
};
