"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AuthNav from "@/app/components/AuthNav";
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
  photoUrl: string | null;
  href: string;
};

type ReviewStats = Record<number, { rating: number; reviewCount: number }>;

const standards = [
  {
    title: "경력 검토",
    description: "실제 지도 경력과 전문 분야를 확인합니다.",
  },
  {
    title: "전문가 인터뷰",
    description: "상담 방식과 전문성을 직접 검토합니다.",
  },
  {
    title: "실제 사례 검토",
    description: "회원 변화 사례와 지도 경험을 확인합니다.",
  },
  {
    title: "프로필 검증",
    description: "자격, 활동 지역, 소개 정보를 점검합니다.",
  },
];

const storyPoints = [
  "TRUPICK은 단순히 많은 전문가를 보여주는 서비스가 아닙니다.",
  "고객의 몸과 시간에 직접 영향을 주는 운동/재활 영역에서 신뢰할 수 있는 선택지를 만드는 것이 목표입니다.",
  "Standards, 실제 후기, 상담 흐름을 통해 더 적은 고민으로 더 나은 전문가를 만날 수 있게 돕습니다.",
];

const searchTags = ["어깨 통증", "체형교정", "다이어트", "재활운동", "러닝", "근력향상"];

function isFitnessExpert(expert: {
  specialty?: string | null;
  category?: string | null;
  profession?: string | null;
}) {
  const text = [expert.specialty, expert.category, expert.profession]
    .filter(Boolean)
    .join(" ");

  return (
    text.includes("운동") ||
    text.includes("재활") ||
    text.includes("트레이너") ||
    text.includes("필라테스") ||
    text.includes("통증") ||
    text.includes("체형")
  );
}

function toLandingExperts(
  experts: Expert[],
  reviewStats: ReviewStats = {}
): LandingExpert[] {
  const fitnessExperts = experts.filter(isFitnessExpert);
  const source = fitnessExperts.map((expert) => {
    const stats = reviewStats[expert.id];

    return {
      id: expert.id,
      name: expert.name,
      profession: expert.specialty,
      category: expert.category || "운동/재활",
      rating: stats?.rating ?? 0,
      reviews: stats?.reviewCount ?? 0,
      distance: "상담 가능",
      isPremium: expert.plan_type === "premium",
      photoUrl: expert.image_url || null,
      href: `/experts/${expert.id}`,
    };
  });

  return source
    .sort((a, b) => Number(b.isPremium) - Number(a.isPremium) || b.rating - a.rating)
    .slice(0, 3);
}

export default function HomePage() {
  const router = useRouter();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({});
  const [heroSearch, setHeroSearch] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadLandingData() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase
          .from("experts")
          .select("*")
          .eq("approved", true)
          .eq("approval_status", "approved")
          .order("plan_type", { ascending: false })
          .limit(3);

        const { data: reviewRows } = await supabase
          .from("reviews")
          .select("expert_id, rating")
          .returns<Array<{ expert_id: number; rating: number }>>();

        const nextReviewStats =
          reviewRows?.reduce<ReviewStats>((stats, review) => {
            const current = stats[review.expert_id] ?? {
              rating: 0,
              reviewCount: 0,
            };
            const nextCount = current.reviewCount + 1;

            stats[review.expert_id] = {
              rating:
                (current.rating * current.reviewCount + review.rating) /
                nextCount,
              reviewCount: nextCount,
            };

            return stats;
          }, {}) ?? {};

        if (isMounted) {
          setReviewStats(nextReviewStats);
          setExperts(data || []);
        }
      } catch (error) {
        console.error("Failed to load featured experts", error);
      }
    }

    void loadLandingData();

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredExperts = useMemo(
    () => toLandingExperts(experts, reviewStats),
    [experts, reviewStats]
  );

  const mapExperts = featuredExperts.length > 0 ? featuredExperts : [];

  function submitHeroSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const query = heroSearch.trim();
    router.push(query ? `/experts?q=${encodeURIComponent(query)}` : "/experts");
  }

  return (
    <main className="min-h-screen bg-[#F6F3EC] text-[#111111]">
      <header className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:flex-nowrap sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-3 text-lg font-extrabold tracking-[0.16em] text-[#111111]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F5132] text-sm font-black text-white">
            ✓
          </span>
          <span>TRUPICK</span>
        </Link>
        <AuthNav />
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-7xl flex-col justify-center px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[#0F5132]">
            PREMIUM VERIFIED NETWORK
          </p>
          <h1 className="mt-6 max-w-4xl text-[clamp(2.6rem,7vw,4.8rem)] font-extrabold leading-[1.04] tracking-normal text-[#111111] sm:tracking-[-0.035em]">
            좋은 전문가를 찾는 일,
            <br />
            TRUPICK이 더 쉽게 만듭니다.
          </h1>
          <p className="mt-7 max-w-2xl text-lg font-bold leading-8 text-[#374151] sm:text-xl">
            운동 · 재활 · 체형교정 전문가를 TRUPICK의 선별 기준으로
            추천받아보세요.
          </p>

          <form
            onSubmit={submitHeroSearch}
            className="mt-9 max-w-3xl rounded-[8px] border border-[#D9CFBF] bg-white p-3 shadow-[0_18px_55px_rgba(24,24,20,0.08)]"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={heroSearch}
                onChange={(event) => setHeroSearch(event.target.value)}
                placeholder="어깨 통증, 다이어트, 체형교정, 러닝..."
                className="min-h-14 flex-1 rounded-[8px] bg-[#F8F6F0] px-5 text-base font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF]"
              />
              <button
                type="submit"
                className="rounded-[8px] bg-[#0F5132] px-7 py-4 text-sm font-black text-white transition hover:bg-[#146C43]"
              >
                검색
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {searchTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => router.push(`/experts?q=${encodeURIComponent(tag)}`)}
                className="rounded-full border border-[#D9CFBF] bg-white px-4 py-2 text-sm font-black text-[#374151] transition hover:border-[#0F5132] hover:text-[#0F5132]"
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/match"
              className="rounded-full bg-[#0F5132] px-8 py-4 text-center text-base font-black text-white shadow-[0_18px_50px_rgba(15,81,50,0.22)] transition hover:bg-[#146C43]"
            >
              전문가 추천받기
            </Link>
            <Link
              href="/experts"
              className="rounded-full border border-[#111111] bg-white px-8 py-4 text-center text-base font-black text-[#111111] shadow-sm transition hover:-translate-y-0.5"
            >
              전체 전문가 보기
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#0F5132]">
            Standards
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] text-[#111111] sm:text-6xl">
            TRUPICK Standards
          </h2>
          <p className="mt-5 text-lg font-bold leading-8 text-[#374151]">
            우리는 누구나 전문가로 노출하지 않습니다.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {standards.map((item, index) => (
            <article
              key={item.title}
              className="rounded-[8px] border border-[#E5E7EB] bg-white p-6"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F2EC] text-sm font-black text-[#0F5132]">
                {index + 1}
              </span>
              <h3 className="mt-5 text-xl font-black text-[#111111]">
                {item.title}
              </h3>
              <p className="mt-3 text-sm font-bold leading-7 text-[#374151]">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#0F5132]">
            지도 기반 탐색
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] text-[#111111] sm:text-6xl">
            가까운 전문가를 지도에서 찾으세요.
          </h2>
          <p className="mt-6 text-lg font-bold leading-8 text-[#374151]">
            승인된 전문가가 등록되면 위치와 상담 가능 지역을 기준으로
            탐색할 수 있도록 준비했습니다.
          </p>
          <Link
            href="/experts"
            className="mt-8 inline-flex w-fit rounded-full bg-[#111111] px-7 py-4 text-sm font-black text-white transition hover:bg-[#333333]"
          >
            지도 기반 탐색 열기
          </Link>
        </div>

        <div className="relative min-h-[520px] overflow-hidden rounded-[8px] border border-[#D9CFBF] bg-[#EFE8DC] shadow-[0_28px_90px_rgba(24,24,20,0.12)]">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,17,17,0.05)_1px,transparent_1px),linear-gradient(0deg,rgba(17,17,17,0.05)_1px,transparent_1px)] bg-[size:56px_56px]" />
          <div className="absolute left-[10%] top-[18%] h-28 w-44 rounded-[8px] bg-white/65" />
          <div className="absolute right-[10%] top-[10%] h-40 w-56 rounded-[8px] bg-white/55" />
          <div className="absolute bottom-[12%] left-[15%] h-36 w-60 rounded-[8px] bg-white/50" />
          <div className="absolute bottom-[20%] right-[12%] h-28 w-44 rounded-[8px] bg-white/60" />

          {mapExperts.map((expert, index) => {
            const positions = [
              "left-[18%] top-[24%]",
              "right-[18%] top-[40%]",
              "left-[36%] bottom-[20%]",
            ];

            return (
              <Link
                key={expert.id}
                href={expert.href}
                className={`absolute ${positions[index]} flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-full border border-[#E5E7EB] bg-white px-3 py-2 shadow-[0_16px_42px_rgba(24,24,20,0.16)] transition hover:-translate-y-[calc(50%+4px)]`}
              >
                <span className="relative h-11 w-11 overflow-hidden rounded-full bg-[#E5E7EB]">
                  {expert.photoUrl ? (
                    <Image
                      src={expert.photoUrl}
                      alt={expert.name}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-[#E8F2EC] text-sm font-black text-[#0F5132]">
                      {expert.name.slice(0, 1)}
                    </span>
                  )}
                </span>
                <span className="min-w-0 pr-2">
                  <span className="block max-w-28 truncate text-sm font-black text-[#111111]">
                    {expert.name}
                  </span>
                  <span className="block text-xs font-bold text-[#4B5563]">
                    {expert.distance}
                  </span>
                </span>
              </Link>
            );
          })}

          <div className="absolute bottom-5 left-5 rounded-[8px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0F5132]">
              Map Ready
            </p>
            <p className="mt-2 text-sm font-bold text-[#374151]">
              위치 검색, 현재 위치, 전문가 마커 연동 예정
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#0F5132]">
              Featured Experts
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] text-[#111111] sm:text-6xl">
              검증된 전문가 3명
            </h2>
          </div>
          <Link href="/experts" className="text-sm font-black text-[#0F5132]">
            전체 전문가 보기
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {featuredExperts.length > 0 ? featuredExperts.map((expert) => (
            <Link
              key={expert.id}
              href={expert.href}
              className="group overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white shadow-[0_22px_70px_rgba(24,24,20,0.08)] transition hover:-translate-y-1"
            >
              <div className="relative h-80 bg-[#E5E7EB]">
                {expert.photoUrl ? (
                  <Image
                    src={expert.photoUrl}
                    alt={expert.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#E8F2EC] text-6xl font-black text-[#0F5132]">
                    {expert.name.slice(0, 1)}
                  </div>
                )}
                {expert.isPremium ? (
                  <span className="absolute left-4 top-4 rounded-full bg-[#111111] px-4 py-2 text-xs font-black text-white">
                    Premium Expert
                  </span>
                ) : null}
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-2xl font-black text-[#111111]">
                      {expert.name}
                    </h3>
                    <p className="mt-2 text-sm font-bold leading-6 text-[#374151]">
                      {expert.profession}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#F5F1E8] px-3 py-2 text-xs font-black text-[#111111]">
                    {expert.distance}
                  </span>
                </div>
                <div className="mt-6 flex flex-wrap gap-2 text-xs font-black">
                  <span className="rounded-full bg-[#E8F2EC] px-3 py-2 text-[#0F5132]">
                    ★ {expert.rating.toFixed(1)}
                  </span>
                  <span className="rounded-full bg-[#F5F1E8] px-3 py-2 text-[#111111]">
                    후기 {expert.reviews}
                  </span>
                  <span className="rounded-full bg-[#FFF1EC] px-3 py-2 text-[#D65339]">
                    {expert.category}
                  </span>
                </div>
              </div>
            </Link>
          )) : (
            <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-10 text-center lg:col-span-3">
              <p className="text-2xl font-black text-[#111111]">
                현재 선별 중인 전문가가 준비 중입니다.
              </p>
              <p className="mx-auto mt-3 max-w-lg text-sm font-bold leading-6 text-[#374151]">
                TRUPICK 팀이 실제 전문가를 검토하고 있습니다. 등록이 승인되면 이곳에 노출됩니다.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-10 rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_28px_90px_rgba(24,24,20,0.08)] sm:p-10 lg:grid-cols-[0.85fr_1.15fr] lg:p-14">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#0F5132]">
              About TRUPICK
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] text-[#111111] sm:text-6xl">
              신뢰할 수 있는 선택을 더 쉽게.
            </h2>
          </div>
          <div className="space-y-6">
            {storyPoints.map((point) => (
              <p
                key={point}
                className="text-lg font-bold leading-9 text-[#374151] sm:text-xl"
              >
                {point}
              </p>
            ))}
            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <Link
                href="/how-we-verify"
                className="rounded-full bg-[#0F5132] px-7 py-4 text-center text-sm font-black text-white transition hover:bg-[#146C43]"
              >
                Standards 보기
              </Link>
              <Link
                href="/experts"
                className="rounded-full border border-[#D9CFBF] bg-white px-7 py-4 text-center text-sm font-black text-[#111111] transition hover:border-[#111111]"
              >
                전문가 찾기
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#E5E7EB] bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p className="text-lg font-black tracking-[0.16em] text-[#111111]">
            TRUPICK
          </p>
          <nav className="flex flex-wrap gap-4 text-sm font-black text-[#111111]">
            <Link href="/experts">Experts</Link>
            <Link href="/become-expert">Become Expert</Link>
            <Link href="/register">Register</Link>
            <Link href="/how-we-verify">Standards</Link>
            <Link href="/feedback">Feedback</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
