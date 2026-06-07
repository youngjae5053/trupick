"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AuthNav from "@/app/components/AuthNav";
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

type ReviewStats = Record<number, { rating: number; reviewCount: number }>;

const standards = [
  {
    title: "Credentials",
    description: "자격, 이력, 활동 정보를 확인해 기본 신뢰 기준을 세웁니다.",
  },
  {
    title: "Expertise",
    description: "재활운동, 통증관리, 체형교정 등 실제 전문성을 검토합니다.",
  },
  {
    title: "Interview",
    description: "전문가의 철학, 문제 해결 방식, 고객 응대 태도를 확인합니다.",
  },
  {
    title: "Monitoring",
    description: "후기, 응답률, 상담 품질을 지속적으로 살펴봅니다.",
  },
];

const storyPoints = [
  "TRUPICK은 단순히 많은 전문가를 보여주는 서비스가 아닙니다.",
  "고객의 몸과 시간에 직접 영향을 주는 운동/재활 영역에서 신뢰할 수 있는 선택지를 만드는 것이 목표입니다.",
  "검증 기준, 실제 후기, 거리 기반 탐색을 통해 더 적은 고민으로 더 나은 전문가를 만날 수 있게 돕습니다.",
];

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

function formatDistance(meters: number) {
  return meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
}

function toLandingExperts(
  experts: Expert[],
  fallbackExperts: ExpertDiscoveryProfile[],
  reviewStats: ReviewStats = {}
): LandingExpert[] {
  const fitnessExperts = experts.filter(isFitnessExpert);
  const fitnessFallbackExperts = fallbackExperts.filter(
    (expert) => expert.category === "운동/재활"
  );
  const source =
    fitnessExperts.length > 0
      ? fitnessExperts.map((expert, index) => {
          const fallback =
            fitnessFallbackExperts[index % fitnessFallbackExperts.length];
          const stats = reviewStats[expert.id];

          return {
            id: expert.id,
            name: expert.name,
            profession: expert.specialty,
            category: expert.category || fallback?.category || "운동/재활",
            rating: stats?.rating ?? fallback?.rating ?? 4.9,
            reviews: stats?.reviewCount ?? fallback?.reviewCount ?? 0,
            distance: fallback ? formatDistance(fallback.distanceMeters) : "1.2km",
            isPremium: expert.plan_type === "premium",
            photoUrl:
              expert.image_url ||
              fallback?.photoUrl ||
              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
            href: `/experts/${expert.id}`,
          };
        })
      : fitnessFallbackExperts.slice(0, 3).map((expert) => ({
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
  const [reviewStats, setReviewStats] = useState<ReviewStats>({});

  useEffect(() => {
    let isMounted = true;

    async function loadLandingData() {
      const nearbyExperts = await getNearbyExperts();

      if (isMounted) {
        setFallbackExperts(nearbyExperts);
      }

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
    () => toLandingExperts(experts, fallbackExperts, reviewStats),
    [experts, fallbackExperts, reviewStats]
  );

  const mapExperts = featuredExperts.length > 0 ? featuredExperts : [];

  return (
    <main className="min-h-screen bg-[#F5F1E8] text-[#111111]">
      <header className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:flex-nowrap sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-2xl font-extrabold tracking-[0.16em] text-[#111111]"
        >
          TRUPICK
        </Link>
        <AuthNav />
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-5xl">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[#0F5132]">
            Premium Verified Network
          </p>
          <h1 className="mt-8 text-[clamp(4rem,16vw,9.5rem)] font-black leading-[0.86] tracking-[-0.055em] text-[#111111]">
            TRUPICK
          </h1>
          <p className="mt-8 max-w-4xl text-[clamp(2.35rem,8vw,5.5rem)] font-black leading-[0.96] tracking-[-0.045em] text-[#111111]">
            Verified Experts. Nothing Less.
          </p>
          <p className="mt-8 max-w-2xl text-lg font-bold leading-8 text-[#374151] sm:text-xl">
            운동/재활 전문가를 경력, 전문성, 인터뷰, 실제 사례 기준으로
            선별합니다. 가까운 전문가를 더 명확하게 비교하고 상담까지
            이어가세요.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/experts"
              className="rounded-full bg-[#0F5132] px-8 py-4 text-center text-base font-black text-white shadow-[0_18px_50px_rgba(15,81,50,0.22)] transition hover:bg-[#146C43]"
            >
              전문가 찾기
            </Link>
            <Link
              href="/register"
              className="rounded-full border border-[#111111] bg-white px-8 py-4 text-center text-base font-black text-[#111111] shadow-sm transition hover:-translate-y-0.5"
            >
              전문가 등록
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#0F5132]">
            Our Standards
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] text-[#111111] sm:text-6xl">
            신뢰는 기준에서 시작됩니다.
          </h2>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-[#E5E7EB] md:grid-cols-4">
          {standards.map((item) => (
            <article key={item.title} className="bg-white p-6 sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F5132]">
                {item.title}
              </p>
              <p className="mt-5 text-lg font-bold leading-8 text-[#374151]">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#0F5132]">
            Find Experts Nearby
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] text-[#111111] sm:text-6xl">
            가까운 전문가를 지도에서 찾으세요.
          </h2>
          <p className="mt-6 text-lg font-bold leading-8 text-[#374151]">
            현재는 TRUPICK의 위치 기반 데이터 구조로 전문가 위치와 거리를
            표시합니다. Kakao Map 키를 연결하면 실제 지도 위 마커로 확장할 수
            있도록 구성했습니다.
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
                  <Image
                    src={expert.photoUrl}
                    alt={expert.name}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
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
              Kakao Map Ready
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
          {featuredExperts.map((expert) => (
            <Link
              key={expert.id}
              href={expert.href}
              className="group overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white shadow-[0_22px_70px_rgba(24,24,20,0.08)] transition hover:-translate-y-1"
            >
              <div className="relative h-80 bg-[#E5E7EB]">
                <Image
                  src={expert.photoUrl}
                  alt={expert.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
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
          ))}
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
                검증 기준 보기
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
            <Link href="/how-we-verify">Verification</Link>
            <Link href="/feedback">Feedback</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
