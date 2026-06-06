import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

export type SocialProvider = "google" | "kakao" | "naver";

type SocialAuthResult = {
  ok: boolean;
  message?: string;
};

export async function signInWithSocialProvider(
  provider: SocialProvider
): Promise<SocialAuthResult> {
  if (provider !== "google") {
    return {
      ok: false,
      message: "소셜 로그인 설정 준비 중입니다.",
    };
  }

  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    alert("Supabase OAuth 설정을 확인해주세요.");
    return { ok: true };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    alert(error.message);
  }

  return { ok: true };
}
