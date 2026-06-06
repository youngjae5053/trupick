"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getFriendlyErrorMessage } from "@/app/errorMessages";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

type ProfileRole = "customer" | "expert" | "admin";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Google 계정 로그인을 확인하고 있습니다.");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function handleOAuthCallback() {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        setErrorMessage("서비스 연결 설정을 확인하는 중입니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      const code = searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          if (isMounted) {
            setErrorMessage(getFriendlyErrorMessage(error.message));
          }
          return;
        }
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        if (isMounted) {
          setErrorMessage("로그인 세션을 확인하지 못했습니다. 다시 로그인해주세요.");
        }
        return;
      }

      if (isMounted) {
        setMessage("회원 정보를 확인하고 있습니다.");
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", userData.user.id)
        .maybeSingle<{ id: string; role: ProfileRole | null }>();

      if (!isMounted) {
        return;
      }

      if (!profile || !profile.role) {
        router.replace("/onboarding");
        return;
      }

      router.replace("/mypage");
    }

    void handleOAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-[#F5F1E8] px-4 py-10 text-[#111111]">
      <section className="mx-auto max-w-lg rounded-[8px] border border-[#E5E7EB] bg-white p-6 text-center shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
          OAuth Callback
        </p>
        <h1 className="mt-3 text-3xl font-black text-[#111111]">
          로그인 처리 중
        </h1>
        <p className="mt-4 text-sm font-bold leading-7 text-[#374151]">
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
        <main className="min-h-screen bg-[#F5F1E8] px-4 py-10 text-[#111111]">
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
