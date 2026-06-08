"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

function buildOAuthErrorMessage({
  error,
  errorCode,
  errorDescription,
}: {
  error: string | null;
  errorCode: string | null;
  errorDescription: string | null;
}) {
  return [
    errorDescription ? `error_description: ${errorDescription}` : "",
    errorCode ? `error_code: ${errorCode}` : "",
    error ? `error: ${error}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function getHashParams() {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  return new URLSearchParams(window.location.hash.replace(/^#/, ""));
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("소셜 로그인을 처리하고 있습니다.");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function handleCallback() {
      const oauthError = searchParams.get("error");
      const oauthErrorCode = searchParams.get("error_code");
      const oauthErrorDescription = searchParams.get("error_description");

      if (oauthError || oauthErrorCode || oauthErrorDescription) {
        const actualError = buildOAuthErrorMessage({
          error: oauthError,
          errorCode: oauthErrorCode,
          errorDescription: oauthErrorDescription,
        });

        console.error("OAuth callback error", {
          error: oauthError,
          error_code: oauthErrorCode,
          error_description: oauthErrorDescription,
        });

        if (isMounted) {
          setErrorMessage(actualError || "소셜 로그인 중 오류가 발생했습니다.");
        }
        return;
      }

      const code = searchParams.get("code");
      const hashParams = getHashParams();
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      let supabase: ReturnType<typeof getSupabaseBrowserClient>;

      try {
        supabase = getSupabaseBrowserClient();
      } catch (error) {
        console.error("Supabase browser client creation failed", error);

        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Supabase 브라우저 클라이언트를 생성하지 못했습니다."
          );
        }
        return;
      }

      let authResult:
        | Awaited<ReturnType<typeof supabase.auth.exchangeCodeForSession>>
        | Awaited<ReturnType<typeof supabase.auth.setSession>>;

      if (code) {
        authResult = await supabase.auth.exchangeCodeForSession(code);
      } else if (accessToken && refreshToken) {
        authResult = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      } else {
        console.error("OAuth callback code and tokens are missing", {
          search: window.location.search,
          hash: window.location.hash,
          hasAccessToken: Boolean(accessToken),
          hasRefreshToken: Boolean(refreshToken),
        });

        if (isMounted) {
          setErrorMessage("OAuth code가 없습니다. 다시 로그인해주세요.");
        }
        return;
      }

      const { data, error } = authResult;

      if (error) {
        console.error(
          code ? "exchangeCodeForSession error" : "setSession error",
          error
        );

        if (isMounted) {
          setErrorMessage(error.message);
        }
        return;
      }

      window.history.replaceState(null, "", "/auth/callback");

      const user = data.session?.user ?? data.user ?? null;

      if (!user) {
        console.error("OAuth session exchange succeeded but user is missing", data);

        if (isMounted) {
          setErrorMessage("로그인 사용자를 확인하지 못했습니다. 다시 로그인해주세요.");
        }
        return;
      }

      if (isMounted) {
        setMessage("회원 정보를 확인하고 있습니다.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle<{ id: string }>();

      if (profileError) {
        console.error("profiles lookup error", profileError);

        if (isMounted) {
          setErrorMessage(profileError.message);
        }
        return;
      }

      if (!isMounted) {
        return;
      }

      router.replace(profile ? "/mypage" : "/onboarding");
    }

    void handleCallback();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-[#F6F3EC] px-4 py-10 text-[#111111]">
      <section className="mx-auto max-w-lg rounded-[8px] border border-[#E5E7EB] bg-white p-6 text-center shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
          OAuth Callback
        </p>
        <h1 className="mt-3 text-3xl font-black text-[#111111]">
          로그인 처리 중
        </h1>
        <p className="mt-4 whitespace-pre-line text-sm font-bold leading-7 text-[#374151]">
          {errorMessage || message}
        </p>
        {errorMessage ? (
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-full bg-[#0F5132] px-6 py-3 text-sm font-black text-white transition hover:bg-[#146C43]"
          >
            로그인으로 돌아가기
          </Link>
        ) : null}
      </section>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F6F3EC] px-4 py-10 text-[#111111]">
          <section className="mx-auto max-w-lg rounded-[8px] border border-[#E5E7EB] bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-black text-[#374151]">
              로그인 정보를 확인하고 있습니다.
            </p>
          </section>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
