"use client";

import { useState } from "react";
import {
  signInWithSocialProvider,
  SocialProvider,
} from "@/app/socialAuth";

const socialButtons: Array<{
  provider: SocialProvider;
  loginLabel: string;
  signupLabel: string;
  mark: string;
}> = [
  {
    provider: "google",
    loginLabel: "Google로 계속하기",
    signupLabel: "Google로 시작하기",
    mark: "G",
  },
  {
    provider: "kakao",
    loginLabel: "Kakao로 계속하기",
    signupLabel: "Kakao로 시작하기",
    mark: "K",
  },
  {
    provider: "naver",
    loginLabel: "Naver로 계속하기",
    signupLabel: "Naver로 시작하기",
    mark: "N",
  },
];

export default function SocialAuthButtons({
  mode,
}: {
  mode: "login" | "signup";
}) {
  const [message, setMessage] = useState("");
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(
    null
  );

  async function handleSocialAuth(provider: SocialProvider) {
    setMessage("");
    setLoadingProvider(provider);

    const result = await signInWithSocialProvider(provider);

    setLoadingProvider(null);

    if (!result.ok && provider !== "google") {
      setMessage(result.message || "소셜 로그인 설정 준비 중입니다.");
    }
  }

  return (
    <section className="mt-7">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[#E5E7EB]" />
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6B7280]">
          {mode === "login" ? "Social login" : "Social signup"}
        </p>
        <div className="h-px flex-1 bg-[#E5E7EB]" />
      </div>

      <div className="mt-4 grid gap-3">
        {socialButtons.map((button) => (
          <button
            key={button.provider}
            type="button"
            onClick={() => handleSocialAuth(button.provider)}
            disabled={loadingProvider !== null}
            className="flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-[#D9CFBF] bg-white px-5 py-3 text-sm font-black text-[#111111] transition hover:-translate-y-0.5 hover:border-[#111111] disabled:translate-y-0 disabled:opacity-70"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E5E7EB] bg-[#FBFAF7] text-xs font-black text-[#111111]">
              {button.mark}
            </span>
            <span>
              {loadingProvider === button.provider
                ? "연결 중..."
                : mode === "signup"
                  ? button.signupLabel
                  : button.loginLabel}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs font-bold leading-5 text-[#6B7280]">
        Google은 Supabase OAuth Provider 설정 후 바로 사용할 수 있습니다. Kakao와
        Naver는 Provider 설정 완료 후 연결됩니다.
      </p>

      {message ? (
        <p className="mt-3 rounded-[8px] bg-[#FFF7ED] p-3 text-sm font-bold leading-6 text-[#9A3412]">
          {message}
        </p>
      ) : null}
    </section>
  );
}
