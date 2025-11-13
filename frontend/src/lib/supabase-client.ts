import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  console.log(
    "DEBUG: NEXT_PUBLIC_SUPABASE_URL:",
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );
  console.log(
    "DEBUG: NEXT_PUBLIC_SUPABASE_ANON_KEY:",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.error(
      "CRITICAL ERROR: Supabase environment variables are missing during client creation!"
    );
    // ビルド時に Supabase の認証情報がない場合、より分かりやすいエラーを発生させます
    throw new Error(
      "Supabase client cannot be created: Missing URL or ANON_KEY environment variables."
    );
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        flowType: "pkce",
        detectSessionInUrl: true,
      },
    }
  );
}
