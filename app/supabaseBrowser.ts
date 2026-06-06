import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log(
    "SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "exists" : "missing"
  );

  if (!supabaseUrl || !supabaseAnonKey) {
    const error = {
      message:
        "NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 브라우저 환경에 없습니다.",
      hasUrl: Boolean(supabaseUrl),
      hasAnonKey: Boolean(supabaseAnonKey),
    };

    console.error(error);
    throw new Error(JSON.stringify(error));
  }

  cachedClient ??= createClient(supabaseUrl, supabaseAnonKey);

  return cachedClient;
}
