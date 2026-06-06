import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

export type SocialProvider = "google" | "kakao" | "naver";

type SocialAuthResult = {
  ok: boolean;
  message?: string;
};

const socialProviderLabels: Record<SocialProvider, string> = {
  google: "Google",
  kakao: "Kakao",
  naver: "Naver",
};

export async function signInWithSocialProvider(
  provider: SocialProvider
): Promise<SocialAuthResult> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return {
      ok: false,
      message: "서비스 연결 설정을 확인하는 중입니다. 잠시 후 다시 시도해주세요.",
    };
  }

  if (provider !== "google") {
    return {
      ok: false,
      message: "소셜 로그인 설정 준비 중입니다.",
    };
  }

  const redirectTo =
    typeof window === "undefined"
      ? undefined
      : `${window.location.origin}/auth/callback`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) {
    return {
      ok: false,
      message: `${socialProviderLabels[provider]} 로그인 연결에 실패했습니다. Supabase OAuth Provider 설정을 확인해주세요.`,
    };
  }

  return { ok: true };
}
