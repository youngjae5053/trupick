"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getFriendlyErrorMessage } from "@/app/errorMessages";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

const freeFeatures = [
  "기본 프로필 노출",
  "상담 요청 수신",
  "리뷰 관리",
  "기본 검색 노출",
];

const premiumFeatures = [
  "상단 우선 노출",
  "Premium Expert 배지",
  "AI 매칭 우선 추천",
  "프로필 분석 리포트",
  "향후 광고 우선권",
];

const comparisonRows = [
  ["전문가 프로필 등록", "포함", "포함"],
  ["상담 요청 수신", "포함", "포함"],
  ["검색 노출", "기본 노출", "상단 우선 노출"],
  ["AI 추천 우선", "-", "동점 시 우선 추천"],
  ["Premium 배지", "-", "포함"],
  ["프로필 분석", "-", "리포트 제공"],
];

export default function PricingPage() {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPremiumForm, setShowPremiumForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  function updateForm(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage("");
  }

  async function submitPremiumRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (
      !form.name.trim() ||
      !form.email.includes("@") ||
      !form.phone.trim() ||
      !form.message.trim()
    ) {
      setMessage("이름, 이메일, 연락처, 신청 사유를 모두 입력해주세요.");
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setMessage("서비스 연결 설정을 확인하는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setSubmitting(true);

    const { data } = await supabase.auth.getUser();
    const user = data.user;
    let expertId: number | null = null;

    if (user) {
      const { data: expert } = await supabase
        .from("experts")
        .select("id")
        .eq("user_id", user.id)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle<{ id: number }>();

      expertId = expert?.id ?? null;
    }

    const { error } = await supabase.from("premium_requests").insert([
      {
        expert_id: expertId,
        user_id: user?.id ?? null,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
        status: "pending",
      },
    ]);

    setSubmitting(false);

    if (error) {
      setMessage(getFriendlyErrorMessage(error.message));
      return;
    }

    setMessage("Premium 신청이 접수되었습니다. 검토 후 안내드릴게요.");
    setShowPremiumForm(false);
    setForm({ name: "", email: "", phone: "", message: "" });
  }

  return (
    <main className="min-h-screen bg-[#F5F1E8] px-4 py-6 text-[#111111] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-[0.16em] text-[#111111]"
          >
            TRUPICK
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/experts"
              className="rounded-full border border-[#D9CFBF] bg-white px-5 py-3 text-sm font-black text-[#0F5132] transition hover:border-[#111111]"
            >
              전문가 둘러보기
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-[#0F5132] px-5 py-3 text-sm font-black text-white transition hover:bg-[#146C43]"
            >
              전문가 등록
            </Link>
          </div>
        </header>

        <section className="mt-10 rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
            Plans for Experts
          </p>
          <h1 className="mt-3 max-w-4xl text-[clamp(2.7rem,8vw,5.8rem)] font-black leading-[0.98] tracking-normal text-[#111111] sm:tracking-[-0.04em]">
            전문가 성장을 위한 플랜
          </h1>
          <p className="mt-5 max-w-2xl text-base font-bold leading-8 text-[#374151] sm:text-lg">
            TRUPICK에서 더 잘 발견되고, 더 많은 상담 기회를 만들 수 있도록
            Free와 Premium 플랜을 명확하게 나눴습니다.
          </p>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <PlanCard
            title="Free Plan"
            price="무료"
            description="처음 시작하는 전문가를 위한 기본 플랜입니다."
            features={freeFeatures}
            cta="무료로 시작하기"
            href="/register"
          />
          <PlanCard
            title="Premium Plan"
            price="월 29,000원"
            description="상단 노출과 추천 우선권으로 더 빠르게 발견되는 플랜입니다."
            features={premiumFeatures}
            cta="Premium 신청하기"
            premium
            onPremiumRequest={() => setShowPremiumForm(true)}
            submitting={submitting}
          />
        </section>

        {showPremiumForm ? (
          <section className="mt-5 rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
                  Premium Application
                </p>
                <h2 className="mt-2 text-3xl font-black text-[#111111]">
                  Premium 신청 정보
                </h2>
                <p className="mt-2 text-sm font-bold leading-6 text-[#374151]">
                  결제 연결 전 단계입니다. 운영자가 검토 후 안내드립니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPremiumForm(false)}
                className="rounded-full border border-[#D9CFBF] bg-white px-4 py-2 text-sm font-black text-[#111111]"
              >
                닫기
              </button>
            </div>

            <form
              onSubmit={submitPremiumRequest}
              className="mt-6 grid gap-4 sm:grid-cols-2"
            >
              <PricingInput
                label="이름"
                value={form.name}
                onChange={(value) => updateForm("name", value)}
                placeholder="이름을 입력해주세요"
              />
              <PricingInput
                label="이메일"
                value={form.email}
                onChange={(value) => updateForm("email", value)}
                placeholder="name@example.com"
              />
              <PricingInput
                label="연락처"
                value={form.phone}
                onChange={(value) => updateForm("phone", value)}
                placeholder="010-0000-0000"
              />
              <label className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-black text-[#111111]">
                  신청 사유 또는 메모
                </span>
                <textarea
                  value={form.message}
                  onChange={(event) => updateForm("message", event.target.value)}
                  placeholder="Premium 전환을 원하는 이유나 문의 내용을 입력해주세요."
                  className="min-h-32 w-full resize-y rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 py-3 text-sm font-bold leading-7 text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
                />
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-[#0F5132] px-6 py-4 text-sm font-black text-white transition hover:bg-[#146C43] disabled:opacity-70 sm:col-span-2"
              >
                {submitting ? "신청 중..." : "신청 제출"}
              </button>
            </form>
          </section>
        ) : null}

        {message ? (
          <section className="mt-5 rounded-[8px] border border-[#D9CFBF] bg-white p-5 text-sm font-black leading-7 text-[#0F5132] shadow-sm">
            {message}
          </section>
        ) : null}

        <section className="mt-6 overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white shadow-sm">
          <div className="grid grid-cols-3 bg-[#FBFAF7] text-sm font-black text-[#111111]">
            <div className="p-4">비교 항목</div>
            <div className="p-4">Free Plan</div>
            <div className="p-4">Premium Plan</div>
          </div>
          {comparisonRows.map(([label, free, premium]) => (
            <div
              key={label}
              className="grid grid-cols-3 border-t border-[#E5E7EB] text-sm font-bold text-[#374151]"
            >
              <div className="p-4 font-black text-[#111111]">{label}</div>
              <div className="p-4">{free}</div>
              <div className="p-4">{premium}</div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

function PricingInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#111111]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
      />
    </label>
  );
}

function PlanCard({
  title,
  price,
  description,
  features,
  cta,
  href,
  premium = false,
  onPremiumRequest,
  submitting = false,
}: {
  title: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  href?: string;
  premium?: boolean;
  onPremiumRequest?: () => void;
  submitting?: boolean;
}) {
  return (
    <article
      className={`rounded-[8px] border p-6 shadow-sm sm:p-7 ${
        premium
          ? "border-[#111111] bg-[#111111] text-white shadow-[0_28px_90px_rgba(17,17,17,0.22)]"
          : "border-[#E5E7EB] bg-white text-[#111111]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          className={`text-sm font-black uppercase tracking-[0.16em] ${
            premium ? "text-white" : "text-[#0F5132]"
          }`}
        >
          {title}
        </p>
        {premium ? (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#111111]">
            추천
          </span>
        ) : null}
      </div>
      <h2 className="mt-4 text-4xl font-black">{price}</h2>
      <p
        className={`mt-4 text-sm font-bold leading-7 ${
          premium ? "text-white" : "text-[#374151]"
        }`}
      >
        {description}
      </p>
      <ul className="mt-6 grid gap-3">
        {features.map((feature) => (
          <li key={feature} className="flex gap-3 text-sm font-black leading-6">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                premium
                  ? "bg-white text-[#111111]"
                  : "bg-[#E8F2EC] text-[#0F5132]"
              }`}
            >
              ✓
            </span>
            {feature}
          </li>
        ))}
      </ul>
      {premium ? (
        <button
          type="button"
          onClick={onPremiumRequest}
          disabled={submitting}
          className="mt-7 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-[#111111] transition hover:bg-[#F5F1E8] disabled:opacity-70"
        >
          {submitting ? "신청 중..." : cta}
        </button>
      ) : (
        <Link
          href={href || "/register"}
          className="mt-7 inline-flex rounded-full bg-[#0F5132] px-5 py-3 text-sm font-black text-white transition hover:bg-[#146C43]"
        >
          {cta}
        </Link>
      )}
    </article>
  );
}
