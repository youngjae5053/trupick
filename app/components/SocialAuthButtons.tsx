"use client";

import { useEffect, useState } from "react";
import type { Provider } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

type SocialProvider = "google";

const socialButtons: Array<{
  provider: SocialProvider;
  loginLabel: string;
  signupLabel: string;
  mark: string;
}> = [
  {
    provider: "google",
    loginLabel: "Google로 계속하기",
    signupLabel: "Google로 계속하기",
    mark: "G",
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

  useEffect(() => {
    const resetLoading = () => {
      setLoadingProvider(null);
      setMessage("");
    };

    window.addEventListener("pageshow", resetLoading);
    return () => window.removeEventListener("pageshow", resetLoading);
  }, []);

  const handleSocialAuth = async (provider: SocialProvider) => {
    setMessage("");
    setLoadingProvider(provider);

    try {
      const supabase = getSupabaseBrowserClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as Provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error(error);
        setMessage(JSON.stringify(error));
        setLoadingProvider(null);
      }
    } catch (error) {
      console.error(error);

      setMessage(
        JSON.stringify(
          error instanceof Error
            ? {
                message: error.message,
                provider,
              }
            : error
        )
      );
      setLoadingProvider(null);
    }
  };

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
        Google 계정으로 빠르게 시작할 수 있습니다.
      </p>

      {message ? (
        <p className="mt-3 rounded-[8px] bg-[#FFF7ED] p-3 text-sm font-bold leading-6 text-[#9A3412]">
          {message}
        </p>
      ) : null}
    </section>
  );
}
