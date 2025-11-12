import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    try {
      const cookieStore = await cookies();

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware handling
                // cookie setting.
              }
            },
          },
        }
      );

      // Debug logs
      console.log("=== AUTH CALLBACK ===");
      console.log("Code:", code);
      console.log("Request URL:", requestUrl.toString());

      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Exchange error:", error);
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=auth_failed`
        );
      }

      console.log("Exchange success");

      // Verify session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error("Session verification failed:", sessionError);
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=session_failed`
        );
      }

      console.log("Session verified:", session.user?.email);

      // URL to redirect to after sign in process completes
      return NextResponse.redirect(new URL("/tip", requestUrl.origin));
    } catch (error) {
      console.error("Unexpected error:", error);
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=auth_failed`
      );
    }
  } else {
    console.error("No authorization code provided");
    return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`);
  }
}
