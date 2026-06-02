"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getFriendlyErrorMessage } from "@/app/errorMessages";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

type UserRole = "customer" | "expert";

const stepItems = [
  ["1", "기본정보"],
  ["2", "계정정보"],
  ["3", "회원유형"],
];

const benefitItems = [
  "검증된 전문가 정보 제공",
  "안전한 상담 신청 및 관리",
  "맞춤형 전문가 추천",
];

const roleCards: Array<{
  role: UserRole;
  title: string;
  label: string;
  description: string;
  features: string[];
}> = [
  {
    role: "customer",
    title: "고객",
    label: "Customer",
    description: "전문가를 찾고 상담을 신청하는 회원",
    features: ["전문가 검색", "상담 신청", "상담 내역 관리"],
  },
  {
    role: "expert",
    title: "전문가",
    label: "Expert",
    description: "프로필을 등록하고 상담을 제공하는 회원",
    features: ["전문가 등록", "상담 제공", "상담 요청 관리"],
  },
];

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setErrorMessage("서비스 연결 설정을 확인하는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    if (name.trim().length === 0) {
      setErrorMessage("이름을 입력해주세요.");
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage("올바른 이메일 형식으로 입력해주세요.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    if (!role) {
      setErrorMessage("회원유형을 선택해주세요.");
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage("이용약관 및 개인정보처리방침에 동의해주세요.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name.trim(),
          role,
          phone: phone.trim() || null,
        },
      },
    });

    setSubmitting(false);

    if (error) {
      setErrorMessage(getFriendlyErrorMessage(error.message));
      return;
    }

    setSuccessMessage(
      "회원가입이 완료되었습니다. 가입 후 인증 메일을 확인해주세요."
    );
    window.setTimeout(() => router.push("/login"), 1800);
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
          <Link href="/experts">전문가 둘러보기</Link>
          <Link href="/request">상담 신청</Link>
          <Link href="/onboarding">이용 안내</Link>
          <Link href="/login">로그인</Link>
          <Link
            href="/signup"
            className="rounded-full bg-[#111111] px-4 py-2 text-white"
          >
            회원가입
          </Link>
        </nav>
        <Link
          href="/login"
          className="rounded-full border border-[#D9CFBF] bg-white px-4 py-2 text-sm font-black text-[#111111] md:hidden"
        >
          로그인
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 pb-12 pt-4 sm:px-6 lg:grid-cols-[65fr_35fr] lg:px-8 lg:pb-20 lg:pt-10">
        <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#0F5132]">
            Join TRUPICK
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-normal text-[#111111] sm:text-5xl">
            회원가입
          </h1>
          <p className="mt-3 text-base font-bold leading-7 text-[#374151]">
            TRUPICK에서 전문가와 고객을 연결해보세요.
          </p>

          <div className="mt-7 grid gap-2 sm:grid-cols-3">
            {stepItems.map(([number, label]) => (
              <div
                key={number}
                className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-3"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F5132] text-sm font-black text-white">
                  {number}
                </span>
                <p className="mt-3 text-sm font-black text-[#111111]">
                  {label}
                </p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-7 grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-black text-[#111111]">이름</label>
                <input
                  placeholder="홍길동"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="mt-2 min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
                />
              </div>
              <div>
                <label className="text-sm font-black text-[#111111]">
                  휴대폰 번호 <span className="text-[#374151]">선택</span>
                </label>
                <input
                  placeholder="010-0000-0000"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="mt-2 min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
                />
              </div>
            </div>

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

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-black text-[#111111]">
                  비밀번호
                </label>
                <input
                  type="password"
                  placeholder="8자 이상"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  className="mt-2 min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
                />
              </div>
              <div>
                <label className="text-sm font-black text-[#111111]">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  placeholder="비밀번호 재입력"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={8}
                  className="mt-2 min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
                />
              </div>
            </div>

            <section className="rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] p-4">
              <p className="text-sm font-black text-[#111111]">회원유형 선택</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {roleCards.map((card) => (
                  <button
                    key={card.role}
                    type="button"
                    onClick={() => setRole(card.role)}
                    className={`rounded-[8px] border p-4 text-left transition hover:-translate-y-0.5 ${
                      role === card.role
                        ? "border-[#0F5132] bg-white shadow-[0_12px_35px_rgba(15,81,50,0.12)]"
                        : "border-[#E5E7EB] bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-black text-[#111111]">
                          {card.title}
                        </h2>
                        <p className="mt-1 text-sm font-black text-[#0F5132]">
                          {card.label}
                        </p>
                      </div>
                      <span
                        className={`mt-1 h-5 w-5 rounded-full border ${
                          role === card.role
                            ? "border-[#0F5132] bg-[#0F5132]"
                            : "border-[#D9CFBF] bg-white"
                        }`}
                      />
                    </div>
                    <p className="mt-3 text-sm font-bold leading-6 text-[#374151]">
                      {card.description}
                    </p>
                    <ul className="mt-3 grid gap-1 text-sm font-bold text-[#374151]">
                      {card.features.map((feature) => (
                        <li key={feature}>- {feature}</li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </section>

            <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-4">
              <p className="text-sm font-black text-[#111111]">이메일 인증 안내</p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#374151]">
                이메일 인증을 통해 계정 보안을 강화합니다. 가입 후 인증 메일을
                확인해주세요.
              </p>
            </div>

            <label className="flex items-start gap-3 rounded-[8px] border border-[#E5E7EB] bg-white p-4 text-sm font-bold leading-6 text-[#374151]">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                className="mt-1 h-4 w-4 accent-[#0F5132]"
              />
              <span>
                TRUPICK 이용약관 및 개인정보처리방침에 동의합니다.
              </span>
            </label>

            {errorMessage ? (
              <p className="rounded-[8px] bg-[#FEE2E2] p-4 text-sm font-bold leading-6 text-[#9B1C1C]">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="rounded-[8px] bg-[#E8F2EC] p-4 text-sm font-bold leading-6 text-[#0F5132]">
                {successMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-[#0F5132] px-6 py-4 text-sm font-black text-white transition hover:bg-[#146C43] disabled:opacity-50"
            >
              {submitting ? "계정 생성 중..." : "계정 만들기"}
            </button>
          </form>

          <p className="mt-6 text-sm font-bold text-[#374151]">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-black text-[#0F5132]">
              로그인
            </Link>
          </p>
        </div>

        <aside className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] lg:sticky lg:top-6 lg:self-start">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
            Membership Guide
          </p>
          <h2 className="mt-3 text-3xl font-black text-[#111111]">
            TRUPICK 회원의 혜택
          </h2>
          <div className="mt-6 grid gap-4">
            <section className="rounded-[8px] bg-[#FBFAF7] p-4">
              <h3 className="text-base font-black text-[#111111]">
                TRUPICK 회원의 혜택
              </h3>
              <ul className="mt-3 grid gap-2 text-sm font-bold leading-6 text-[#374151]">
                {benefitItems.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-[8px] bg-[#FBFAF7] p-4">
              <h3 className="text-base font-black text-[#111111]">
                이메일 인증
              </h3>
              <ul className="mt-3 grid gap-2 text-sm font-bold leading-6 text-[#374151]">
                <li>- 계정 보안 강화</li>
                <li>- 인증 완료 후 모든 서비스 이용 가능</li>
              </ul>
            </section>

            <section className="rounded-[8px] bg-[#FBFAF7] p-4">
              <h3 className="text-base font-black text-[#111111]">
                고객 vs 전문가
              </h3>
              <div className="mt-3 grid gap-3 text-sm font-bold leading-6 text-[#374151]">
                <p>
                  <span className="font-black text-[#111111]">고객:</span>{" "}
                  전문가 검색과 상담 신청
                </p>
                <p>
                  <span className="font-black text-[#111111]">전문가:</span>{" "}
                  프로필 등록과 상담 관리
                </p>
              </div>
            </section>

            <section className="rounded-[8px] bg-[#FBFAF7] p-4">
              <h3 className="text-base font-black text-[#111111]">
                안전한 서비스
              </h3>
              <ul className="mt-3 grid gap-2 text-sm font-bold leading-6 text-[#374151]">
                <li>- 개인정보 보호</li>
                <li>- SSL 암호화 통신</li>
                <li>- 24/7 보안 모니터링</li>
              </ul>
            </section>
          </div>
        </aside>
      </section>
    </main>
  );
}
