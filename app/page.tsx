"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AuthNav from "@/app/components/AuthNav";
import { expertCategories, getCategoryHref } from "@/app/expertCategories";
import {
  ExpertDiscoveryProfile,
  getNearbyExperts,
} from "@/app/experts/expertDiscoveryData";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

type Expert = {
  id: number;
  name: string;
  specialty: string;
  location: string;
  description: string;
  category?: string | null;
  plan_type?: "free" | "premium" | null;
  image_url?: string | null;
};

type LandingExpert = {
  id: number;
  name: string;
  profession: string;
  category: string;
  rating: number;
  reviews: number;
  distance: string;
  isPremium: boolean;
  photoUrl: string;
  href: string;
};

const proofItems = [
  { value: "4.9", label: "평균 만족도" },
  { value: "5km", label: "거리 기반 탐색" },
  { value: "TOP3", label: "AI 추천 리포트" },
];

const whyItems = [
  {
    icon: "V",
    title: "검증",
    description: "승인된 전문가만 노출",
  },
  {
    icon: "D",
    title: "거리 기반 탐색",
    description: "가까운 전문가를 우선 추천",
  },
  {
    icon: "AI",
    title: "AI 추천",
    description: "사용자 상황에 맞는 전문가 추천",
  },
];

const steps = [
  ["STEP 1", "전문가 찾기"],
  ["STEP 2", "상담 요청"],
  ["STEP 3", "전문가 매칭"],
  ["STEP 4", "문제 해결"],
];

const reviews = [
  {
    name: "김서연",
    category: "운동/재활",
    quote:
      "집 근처에서 재활 경험이 있는 코치를 바로 찾았어요. 첫 상담부터 제 상태를 정확히 짚어줘서 안심됐습니다.",
  },
  {
    name: "박준호",
    category: "세무",
    quote:
      "사업자 세금 상담이 막막했는데, 필요한 전문가만 추려서 볼 수 있어 시간이 정말 줄었습니다.",
  },
  {
    name: "이하린",
    category: "디자인",
    quote:
      "포트폴리오와 거리, 후기까지 한 번에 비교되니 의사결정이 훨씬 쉬웠어요.",
  },
];

function formatDistance(meters: number) {
  return meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
}

function toLandingExperts(
  experts: Expert[],
  fallbackExperts: ExpertDiscoveryProfile[]
): LandingExpert[] {
  const source =
    experts.length > 0
      ? experts.map((expert, index) => {
          const fallback = fallbackExperts[index % fallbackExperts.length];

          return {
            id: expert.id,
            name: expert.name,
            profession: expert.specialty,
            category: expert.category || fallback?.category || "전문가",
            rating: fallback?.rating || 4.9,
            reviews: 80 + index * 23,
            distance: fallback ? formatDistance(fallback.distanceMeters) : "1.2km",
            isPremium: expert.plan_type === "premium",
            photoUrl:
              expert.image_url ||
              fallback?.photoUrl ||
              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80",
            href: `/experts/${expert.id}`,
          };
        })
      : fallbackExperts.slice(0, 3).map((expert) => ({
          id: expert.id,
          name: expert.nickname,
          profession: expert.profession,
          category: expert.category,
          rating: expert.rating,
          reviews: expert.reviewCount,
          distance: formatDistance(expert.distanceMeters),
          isPremium: expert.planType === "premium",
          photoUrl: expert.photoUrl,
          href: "/experts",
        }));

  return source
    .sort((a, b) => Number(b.isPremium) - Number(a.isPremium) || b.rating - a.rating)
    .slice(0, 3);
}

export default function HomePage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [fallbackExperts, setFallbackExperts] = useState<ExpertDiscoveryProfile[]>(
    []
  );

  useEffect(() => {
    let isMounted = true;

    async function loadLandingData() {
      const nearbyExperts = await getNearbyExperts();
      const supabase = getSupabaseBrowserClient();

      if (isMounted) {
        setFallbackExperts(nearbyExperts);
      }

      if (!supabase) {
        return;
      }

      const { data } = await supabase
        .from("experts")
        .select("*")
        .eq("approved", true)
        .or("status.is.null,status.neq.rejected")
        .order("plan_type", { ascending: false })
        .limit(3);

      if (isMounted) {
        if (data) {
          setExperts(data);
          return;
        }

        const { data: fallbackData } = await supabase
          .from("experts")
          .select("*")
          .eq("approved", true)
          .limit(3);

        setExperts(fallbackData || []);
      }
    }

    void loadLandingData();

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredExperts = useMemo(
    () => toLandingExperts(experts, fallbackExperts),
    [experts, fallbackExperts]
  );

  return (
    <main className="min-h-screen bg-[#F5F1E8] text-[#111111]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="text-2xl font-extrabold tracking-[0.16em] text-[#111111]">
          TRUPICK
        </Link>
        <AuthNav />
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 pb-20 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:px-8 lg:pb-28 lg:pt-16">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#0f3d2e]">
            TRUSTED EXPERT NETWORK
          </p>
          <h1 className="mt-5 max-w-3xl text-[56px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#111111] max-sm:text-[44px]">
            Find the right expert.
          </h1>
          <p className="mt-4 max-w-2xl text-[28px] font-extrabold leading-[1.18] tracking-[-0.03em] text-[#111111] max-sm:text-[24px]">
            가장 적합한 전문가를 찾으세요.
          </p>
          <p className="mt-6 max-w-2xl whitespace-pre-line text-lg font-bold leading-8 text-[#4B5563] sm:text-xl">
            {`운동·재활, 세무, 법률, 디자인, 마케팅까지
검증된 전문가를 거리와 평점 기준으로 탐색하세요.`}
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/experts"
              className="rounded-full bg-[#0F5132] px-7 py-4 text-base font-black text-white shadow-[0_14px_40px_rgba(15,81,50,0.22)] transition hover:bg-[#146C43]"
            >
              전문가 찾기
            </Link>
            <Link
              href="/register"
              className="rounded-full border border-[#d9d2c6] bg-white px-7 py-4 text-base font-black text-[#111111] shadow-sm transition hover:border-[#111111]"
            >
              전문가 등록
            </Link>
            <Link
              href="/beta"
              className="rounded-full border border-[#111111] bg-[#111111] px-7 py-4 text-base font-black text-white shadow-sm transition hover:bg-[#333333]"
            >
              Beta Test 참여하기
            </Link>
          </div>
          <Link
            href="/onboarding"
            className="mt-5 inline-flex text-sm font-black text-[#0F5132] underline underline-offset-4"
          >
            처음이신가요? TRUPICK 이용 흐름 보기
          </Link>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {proofItems.map((item) => (
              <div
                key={item.label}
                className="rounded-[8px] border border-[#E5E7EB] bg-[#FFFFFF] p-4 shadow-sm"
              >
                <p className="text-2xl font-black">{item.value}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-[#6c665d]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[520px] overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-[#FFFFFF] shadow-[0_28px_90px_rgba(24,24,20,0.13)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.95)_0%,rgba(242,239,230,0.92)_52%,rgba(225,219,207,0.98)_100%)]" />
          <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-[6px] border-white bg-[#ff5a5f] text-center text-sm font-black leading-[5.3rem] text-white shadow-[0_18px_50px_rgba(255,90,95,0.34)]">
            YOU
          </div>
          {[0.38, 0.62, 0.84].map((scale) => (
            <div
              key={scale}
              className="absolute left-1/2 top-1/2 rounded-full border border-[#111111]/10"
              style={{
                width: `${scale * 100}%`,
                height: `${scale * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
          {featuredExperts.map((expert, index) => {
            const positions = [
              "left-[12%] top-[16%]",
              "right-[9%] top-[30%]",
              "left-[18%] bottom-[14%]",
            ];

            return (
              <Link
                key={expert.id}
                href={expert.href}
                className={`absolute ${positions[index]} w-56 rounded-[8px] border border-[#E5E7EB] bg-[#FFFFFF] p-3 shadow-[0_18px_50px_rgba(24,24,20,0.14)] transition hover:-translate-y-[4px]`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-full bg-[#ebe7df]">
                    <Image
                      src={expert.photoUrl}
                      alt={expert.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#111111]">{expert.name}</p>
                    <p className="truncate text-xs font-bold text-[#6c665d]">
                      {expert.distance} · {expert.rating.toFixed(1)}
                    </p>
                  </div>
                </div>
                {expert.isPremium ? (
                  <p className="mt-3 inline-flex rounded-full bg-[#111111] px-3 py-1 text-[11px] font-black text-white">
                    ✓ PREMIUM
                  </p>
                ) : null}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
              Categories
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-normal text-[#111111]">
              필요한 분야부터 선택하세요
            </h2>
          </div>
          <Link href="/experts" className="text-sm font-black text-[#0f3d2e]">
            전체 전문가 보기
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {expertCategories.map((category) => (
            <Link
              key={category.label}
              href={getCategoryHref(category.label)}
              className="rounded-[8px] border border-[#E5E7EB] bg-[#FFFFFF] p-5 shadow-sm transition hover:-translate-y-[4px] hover:border-[#111111] hover:shadow-[0_18px_45px_rgba(24,24,20,0.08)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#111111] text-sm font-black text-white">
                {category.icon}
              </span>
              <h3 className="mt-5 text-xl font-bold text-[#111111]">{category.label}</h3>
              <p className="mt-2 text-sm font-bold leading-6 text-[#4B5563]">
                {category.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
              Featured experts
            </p>
            <h2 className="mt-3 text-4xl font-black text-[#111111]">오늘의 추천 전문가</h2>
          </div>
          <Link href="/experts" className="text-sm font-black text-[#0f3d2e]">
            전체 보기
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {featuredExperts.map((expert) => (
            <Link
              key={expert.id}
              href={expert.href}
              className="overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-[#FFFFFF] shadow-[0_20px_65px_rgba(24,24,20,0.09)] transition hover:-translate-y-[4px]"
            >
              <div className="relative h-72 bg-[#ebe7df]">
                <Image
                  src={expert.photoUrl}
                  alt={expert.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover"
                />
                {expert.isPremium ? (
                  <span className="absolute left-4 top-4 rounded-full bg-[#111111] px-4 py-2 text-xs font-black text-white">
                    ✓ PREMIUM
                  </span>
                ) : null}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-bold text-[#111111]">{expert.name}</h3>
                    <p className="mt-1 text-sm font-bold text-[#4B5563]">
                      {expert.profession}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#f7f3ea] px-3 py-2 text-xs font-black">
                    {expert.distance}
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-2 text-sm font-black">
                  <span className="rounded-full bg-[#e8f2ec] px-3 py-2 text-[#0f3d2e]">
                    ★ {expert.rating.toFixed(1)}
                  </span>
                  <span className="rounded-full bg-[#f7f3ea] px-3 py-2">
                    후기 {expert.reviews}개
                  </span>
                  <span className="rounded-full bg-[#fff1ec] px-3 py-2 text-[#d65339]">
                    {expert.category}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[8px] bg-[#111111] p-6 text-white sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-white/55">
            Why TRUPICK
          </p>
          <h2 className="mt-3 text-4xl font-black text-white">왜 TRUPICK인가?</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {whyItems.map((item) => (
              <div key={item.title} className="rounded-[8px] bg-white/8 p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-black text-[#111111]">
                  {item.icon}
                </span>
                <h3 className="mt-5 text-2xl font-black">{item.title}</h3>
                <p className="mt-2 text-sm font-bold leading-6 text-white/68">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
          How it works
        </p>
        <h2 className="mt-3 text-4xl font-black text-[#111111]">실제 이용 흐름</h2>
        <div className="mt-8 grid gap-3 md:grid-cols-4">
          {steps.map(([step, title]) => (
            <div
              key={step}
              className="rounded-[8px] border border-[#E5E7EB] bg-[#FFFFFF] p-5 shadow-sm transition hover:-translate-y-[4px]"
            >
              <p className="text-xs font-black text-[#8a8073]">{step}</p>
              <h3 className="mt-5 text-2xl font-bold text-[#111111]">{title}</h3>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
          Reviews
        </p>
        <h2 className="mt-3 text-4xl font-black text-[#111111]">사용자가 먼저 경험했습니다</h2>
        <Link
          href="/reviews"
          className="mt-3 inline-flex text-sm font-black text-[#0F5132] underline underline-offset-4"
        >
          전체 후기 보기
        </Link>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {reviews.map((review) => (
            <article
              key={review.name}
              className="rounded-[8px] border border-[#E5E7EB] bg-[#FFFFFF] p-6 shadow-sm transition hover:-translate-y-[4px]"
            >
              <p className="text-sm font-black text-[#0f3d2e]">
                {review.category}
              </p>
              <p className="mt-5 text-lg font-black leading-8">
                “{review.quote}”
              </p>
              <p className="mt-5 text-sm font-bold text-[#4B5563]">
                {review.name}
              </p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#E5E7EB] bg-[#FFFFFF]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-xl font-extrabold tracking-[0.16em] text-[#111111]">TRUPICK</p>
            <p className="mt-2 text-sm font-bold text-[#4B5563]">
              검증된 전문가를 가장 쉽게 찾는 방법
            </p>
          </div>
          <nav className="flex flex-wrap gap-4 text-sm font-black text-[#111111]">
            <Link href="/">회사 소개</Link>
            <Link href="/">이용약관</Link>
            <Link href="/">개인정보처리방침</Link>
            <Link href="/beta">Beta Test</Link>
            <Link href="/feedback">피드백</Link>
            <Link href="/request">문의하기</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
