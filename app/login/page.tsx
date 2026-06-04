"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { trackAnalyticsEvent } from "@/app/analytics";
import { getFriendlyErrorMessage } from "@/app/errorMessages";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

type UserRole = "customer" | "expert" | "admin";

const introItems = ["검증된 전문가", "안전한 상담", "맞춤 추천"];

function getRoleDestination(role: UserRole | null) {
  if (role === "admin") {
    return "/admin/experts";
  }

  if (role === "expert") {
    return "/my-consultations";
  }

  return "/";
}

function getSafeRedirectPath() {
  if (typeof window === "undefined") {
    return null;
  }

  const redirectTo = new URLSearchParams(window.location.search).get("redirect");

  if (!redirectTo || !redirectTo.startsWith("/") || redirectTo.startsWith("//")) {
    return null;
  }

  return redirectTo;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setSubmitting(false);
      setErrorMessage("서비스 연결 설정을 확인하는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setSubmitting(false);
      setErrorMessage(getFriendlyErrorMessage(error.message));
      return;
    }

    const user = data.user;
    let role = (user?.user_metadata?.role as UserRole | undefined) ?? null;

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle<{ role: UserRole }>();

      role = profile?.role ?? role;
    }

    setSubmitting(false);
    void trackAnalyticsEvent({
      eventName: "login",
      page: "/login",
      metadata: {
        role: role ?? "customer",
        remember_me: rememberMe,
      },
    });
    router.push(getSafeRedirectPath() || getRoleDestination(role));
  }

  return (
    <main className="min-h-screen bg-[#F5F1E8] text-[#111111]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-2xl font-extrabold tracking-[0.16em] text-[#111111]"
        >
          TRUPICK
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-black text-[#111111] md:flex">
          <Link href="/experts" className="transition hover:text-[#0F5132]">
            전문가 둘러보기
          </Link>
          <Link href="/request" className="transition hover:text-[#0F5132]">
            상담 신청
          </Link>
          <Link href="/onboarding" className="transition hover:text-[#0F5132]">
            이용 안내
          </Link>
          <Link href="/login" className="transition hover:text-[#0F5132]">
            로그인
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-[#111111] px-4 py-2 text-white transition hover:bg-[#0F5132]"
          >
            회원가입
          </Link>
        </nav>
        <Link
          href="/signup"
          className="rounded-full border border-[#D9CFBF] bg-white px-4 py-2 text-sm font-black text-[#111111] transition hover:border-[#111111] md:hidden"
        >
          회원가입
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 pb-12 pt-4 sm:px-6 lg:grid-cols-[65fr_35fr] lg:px-8 lg:pb-20 lg:pt-10">
        <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8 lg:p-10">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#0F5132]">
            Welcome Back
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-normal text-[#111111] sm:text-5xl">
            로그인
          </h1>
          <p className="mt-3 text-base font-bold leading-7 text-[#374151]">
            검증된 전문가와 연결되는 가장 쉬운 방법
          </p>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
            <div>
              <label className="text-sm font-black text-[#111111]">이메일</label>
              <input
                type="email"
                placeholder="hello@trupick.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="mt-2 min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
              />
            </div>

            <div>
              <label className="text-sm font-black text-[#111111]">
                비밀번호
              </label>
              <input
                type="password"
                placeholder="비밀번호를 입력해주세요"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="mt-2 min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[#E5E7EB] bg-white p-4">
              <label className="flex items-center gap-3 text-sm font-bold text-[#374151]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 accent-[#0F5132]"
                />
                로그인 상태 유지
              </label>
              <Link
                href="/login?mode=reset"
                className="text-sm font-black text-[#0F5132] underline underline-offset-4"
              >
                비밀번호 찾기
              </Link>
            </div>

            {errorMessage ? (
              <p className="rounded-[8px] bg-[#FEE2E2] p-4 text-sm font-bold leading-6 text-[#9B1C1C]">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-[#0F5132] px-6 py-4 text-sm font-black text-white shadow-[0_14px_34px_rgba(15,81,50,0.18)] transition hover:-translate-y-0.5 hover:bg-[#146C43] disabled:translate-y-0 disabled:opacity-70"
            >
              {submitting ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <p className="mt-6 text-sm font-bold text-[#374151]">
            계정이 없으신가요?{" "}
            <Link href="/signup" className="font-black text-[#0F5132]">
              회원가입
            </Link>
          </p>
        </div>

        <aside className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] lg:sticky lg:top-6 lg:self-start">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
            TRUPICK Guide
          </p>
          <h2 className="mt-3 text-3xl font-black text-[#111111]">
            신뢰할 수 있는 전문가 네트워크
          </h2>
          <div className="mt-6 grid gap-4">
            <section className="rounded-[8px] bg-[#FBFAF7] p-4 transition hover:-translate-y-0.5">
              <h3 className="text-base font-black text-[#111111]">
                TRUPICK 소개
              </h3>
              <ul className="mt-3 grid gap-2 text-sm font-bold leading-6 text-[#374151]">
                {introItems.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-[8px] bg-[#FBFAF7] p-4 transition hover:-translate-y-0.5">
              <h3 className="text-base font-black text-[#111111]">회원 유형</h3>
              <div className="mt-3 grid gap-4 text-sm font-bold leading-6 text-[#374151] sm:grid-cols-2 lg:grid-cols-1">
                <div>
                  <p className="font-black text-[#111111]">고객:</p>
                  <ul className="mt-2 grid gap-1">
                    <li>- 전문가 검색</li>
                    <li>- 상담 신청</li>
                    <li>- 상담 내역 관리</li>
                  </ul>
                </div>
                <div>
                  <p className="font-black text-[#111111]">전문가:</p>
                  <ul className="mt-2 grid gap-1">
                    <li>- 프로필 등록</li>
                    <li>- 상담 제공</li>
                    <li>- 수익 창출</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-[8px] bg-[#FBFAF7] p-4 transition hover:-translate-y-0.5">
              <h3 className="text-base font-black text-[#111111]">
                안전한 서비스
              </h3>
              <ul className="mt-3 grid gap-2 text-sm font-bold leading-6 text-[#374151]">
                <li>- SSL 암호화</li>
                <li>- 개인정보 보호</li>
                <li>- 관리자 검증 시스템</li>
              </ul>
            </section>
          </div>
        </aside>
      </section>
    </main>
  );
}
