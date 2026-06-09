"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFriendlyErrorMessage } from "@/app/errorMessages";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

type UserRole = "customer" | "expert";

const roleCards: Array<{
  role: UserRole;
  title: string;
  label: string;
  description: string;
  items: string[];
}> = [
  {
    role: "customer",
    title: "고객",
    label: "Customer",
    description: "운동/재활 전문가를 찾고 상담을 신청합니다.",
    items: ["전문가 탐색", "AI 매칭", "상담 내역 관리"],
  },
  {
    role: "expert",
    title: "전문가",
    label: "Expert",
    description: "검증 전문가 프로필을 등록하고 상담 요청을 관리합니다.",
    items: ["프로필 등록", "상담 요청 관리", "Premium 신청"],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadUserProfile() {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        setMessage("계정 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.replace("/login?redirect=/onboarding");
        return;
      }

      const displayName =
        (userData.user.user_metadata?.name as string | undefined) ||
        (userData.user.user_metadata?.full_name as string | undefined) ||
        userData.user.email?.split("@")[0] ||
        "";

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, role")
        .eq("id", userData.user.id)
        .maybeSingle<{ name: string | null; role: UserRole | "admin" | null }>();

      if (!isMounted) {
        return;
      }

      setEmail(userData.user.email ?? "");
      setName(profile?.name || displayName);
      setRole(
        profile?.role === "customer" || profile?.role === "expert"
          ? profile.role
          : ""
      );
      setLoading(false);
    }

    void loadUserProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (name.trim().length === 0) {
      setMessage("이름을 입력해주세요.");
      return;
    }

    if (!role) {
      setMessage("회원유형을 선택해주세요.");
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setMessage("계정 정보를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setSubmitting(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setSubmitting(false);
      router.replace("/login?redirect=/onboarding");
      return;
    }

    const payload = {
      id: userData.user.id,
      name: name.trim(),
      role,
    };

    const { error } = await supabase
      .from("profiles")
      .upsert([payload], { onConflict: "id" });

    if (error) {
      setSubmitting(false);
      setMessage(getFriendlyErrorMessage(error.message));
      return;
    }

    setSubmitting(false);
    router.push("/mypage");
  }

  return (
    <main className="min-h-screen bg-[#F5F1E8] text-[#111111]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-xl font-extrabold tracking-[0.16em] text-[#111111]"
        >
          TRUPICK
        </Link>
        <Link
          href="/experts"
          className="rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-black text-[#111111] shadow-sm transition hover:border-[#111111]"
        >
          운동 전문가 보기
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-12 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8 lg:pb-20 lg:pt-14">
        <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#0F5132]">
            Complete Profile
          </p>
          <h1 className="mt-4 text-[40px] font-black leading-[1.02] tracking-normal text-[#111111] sm:text-[56px]">
            TRUPICK 시작을 위한 기본 정보를 설정해주세요.
          </h1>
          <p className="mt-5 text-base font-bold leading-8 text-[#4B5563]">
            Google 로그인 후 이름과 회원유형을 저장하면 마이페이지에서 역할에 맞는 기능을 바로 사용할 수 있습니다.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
            <div>
              <label className="text-sm font-black text-[#111111]">이름</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="이름을 입력해주세요"
                disabled={loading}
                className="mt-2 min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111] disabled:opacity-70"
              />
            </div>

            <section className="rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] p-4">
              <p className="text-sm font-black text-[#111111]">회원유형 선택</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {roleCards.map((card) => (
                  <button
                    key={card.role}
                    type="button"
                    onClick={() => setRole(card.role)}
                    disabled={loading}
                    className={`rounded-[8px] border p-4 text-left transition hover:-translate-y-0.5 disabled:opacity-70 ${
                      role === card.role
                        ? "border-[#0F5132] bg-white shadow-[0_12px_35px_rgba(15,81,50,0.12)]"
                        : "border-[#E5E7EB] bg-white"
                    }`}
                  >
                    <p className="text-xl font-black text-[#111111]">
                      {card.title}
                    </p>
                    <p className="mt-1 text-sm font-black text-[#0F5132]">
                      {card.label}
                    </p>
                    <p className="mt-3 text-sm font-bold leading-6 text-[#374151]">
                      {card.description}
                    </p>
                    <ul className="mt-3 grid gap-1 text-sm font-bold text-[#374151]">
                      {card.items.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </section>

            {message ? (
              <p className="rounded-[8px] bg-[#FFF7ED] p-4 text-sm font-bold leading-6 text-[#9A3412]">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading || submitting}
              className="rounded-full bg-[#0F5132] px-6 py-4 text-sm font-black text-white transition hover:bg-[#146C43] disabled:opacity-60"
            >
              {submitting ? "저장 중..." : "마이페이지로 이동"}
            </button>
          </form>
        </div>

        <aside className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] lg:sticky lg:top-6 lg:self-start">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
            Account
          </p>
          <h2 className="mt-3 text-3xl font-black text-[#111111]">
            계정 설정
          </h2>
          <div className="mt-6 grid gap-4">
            <section className="rounded-[8px] bg-[#FBFAF7] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6B7280]">
                Email
              </p>
              <p className="mt-2 break-all text-sm font-black text-[#111111]">
                {email || "로그인 정보를 확인 중입니다."}
              </p>
            </section>
            <section className="rounded-[8px] bg-[#FBFAF7] p-4">
              <h3 className="text-base font-black text-[#111111]">
                고객으로 시작하면
              </h3>
              <p className="mt-2 text-sm font-bold leading-7 text-[#374151]">
                운동/재활 전문가 탐색, AI 매칭, 상담 요청과 리뷰 작성을 사용할 수 있습니다.
              </p>
            </section>
            <section className="rounded-[8px] bg-[#FBFAF7] p-4">
              <h3 className="text-base font-black text-[#111111]">
                전문가로 시작하면
              </h3>
              <p className="mt-2 text-sm font-bold leading-7 text-[#374151]">
                검증 전문가 신청, 상담 요청 관리, 프로필 완성도 관리를 사용할 수 있습니다.
              </p>
            </section>
          </div>
        </aside>
      </section>
    </main>
  );
}
