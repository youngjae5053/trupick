"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  ExpertDiscoveryProfile,
  getNearbyExperts,
  mockUserLocation,
} from "./expertDiscoveryData";
import {
  ExpertCategory,
  expertCategories,
  expertCategoryLabels,
  getCategoryHref,
  isExpertCategory,
} from "@/app/expertCategories";
import { trackAnalyticsEvent } from "@/app/analytics";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";
import { getProfileCompleteness } from "@/app/profileCompleteness";

type ApprovedExpertRow = {
  id: number;
  name: string;
  specialty: string;
  category?: ExpertCategory | null;
  plan_type?: "free" | "premium" | null;
  image_url?: string | null;
};

const distanceRings = [
  { label: "500m", meters: 500 },
  { label: "1km", meters: 1000 },
  { label: "3km", meters: 3000 },
  { label: "5km", meters: 5000 },
];

const maxRadarDistance = 5000;
const allCategoryLabels = expertCategoryLabels;

function formatDistance(meters: number) {
  if (meters < 1000) {
    return `${meters}m`;
  }

  return `${(meters / 1000).toFixed(meters % 1000 === 0 ? 0 : 1)}km`;
}

function getMarkerPosition(expert: ExpertDiscoveryProfile) {
  const radius = Math.min(expert.distanceMeters / maxRadarDistance, 1) * 46;
  const angle = (expert.bearingDegrees - 90) * (Math.PI / 180);

  return {
    left: `${50 + Math.cos(angle) * radius}%`,
    top: `${50 + Math.sin(angle) * radius}%`,
  };
}

function sortPremiumFirst(experts: ExpertDiscoveryProfile[]) {
  return [...experts].sort((a, b) => {
    if (a.planType !== b.planType) {
      return a.planType === "premium" ? -1 : 1;
    }

    return b.rating - a.rating;
  });
}

function deriveCategory(specialty: string): ExpertCategory {
  if (
    specialty.includes("운동") ||
    specialty.includes("재활") ||
    specialty.includes("트레이너")
  ) {
    return "운동/재활";
  }

  if (specialty.includes("세무") || specialty.includes("세금")) {
    return "세무";
  }

  if (specialty.includes("법") || specialty.includes("변호")) {
    return "법률";
  }

  if (specialty.includes("사진") || specialty.includes("영상")) {
    return "사진/영상";
  }

  if (specialty.includes("디자인") || specialty.includes("브랜드")) {
    return "디자인";
  }

  if (specialty.includes("마케팅") || specialty.includes("광고")) {
    return "마케팅";
  }

  if (specialty.includes("심리") || specialty.includes("상담")) {
    return "심리상담";
  }

  return "디자인";
}

function mapApprovedExperts(
  rows: ApprovedExpertRow[],
  fallbackExperts: ExpertDiscoveryProfile[]
): ExpertDiscoveryProfile[] {
  return rows.map((expert, index) => {
    const fallback = fallbackExperts[index % fallbackExperts.length];

    return {
      id: expert.id,
      nickname: expert.name,
      profession: expert.specialty,
      category:
        expert.category && isExpertCategory(expert.category)
          ? expert.category
          : deriveCategory(expert.specialty),
      location: fallback?.location ?? "서울",
      description:
        fallback?.description ??
        "TRUPICK에서 승인한 전문가입니다. 상담 목적에 맞춰 실질적인 해결 방향을 제안합니다.",
      career: fallback?.career ?? "TRUPICK Verified Expert",
      certifications: fallback?.certifications ?? [],
      consultationMethods: fallback?.consultationMethods ?? ["Online"],
      snsUrl: fallback?.snsUrl ?? null,
      portfolioUrl: fallback?.portfolioUrl ?? null,
      planType: expert.plan_type === "premium" ? "premium" : "free",
      rating: fallback?.rating ?? 4.9,
      reviewCount: fallback?.reviewCount ?? 72,
      distanceMeters: fallback?.distanceMeters ?? 1200,
      bearingDegrees: fallback?.bearingDegrees ?? index * 48,
      photoUrl:
        expert.image_url ||
        fallback?.photoUrl ||
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80",
    };
  });
}

function ExpertsDiscoveryContent({
  initialCategory,
}: {
  initialCategory: ExpertCategory | null;
}) {
  const [experts, setExperts] = useState<ExpertDiscoveryProfile[]>([]);
  const [activeCategories, setActiveCategories] = useState<ExpertCategory[]>(
    initialCategory ? [initialCategory] : allCategoryLabels
  );
  const [selectedExpertId, setSelectedExpertId] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState(mockUserLocation.label);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadExperts() {
      const fallbackExperts = await getNearbyExperts();
      const supabase = getSupabaseBrowserClient();
      let data = fallbackExperts;

      if (supabase) {
        const { data: approvedRows, error } = await supabase
          .from("experts")
          .select("id, name, specialty, category, plan_type, image_url")
          .eq("approved", true)
          .or("status.is.null,status.neq.rejected");

        if (error) {
          const { data: fallbackRows } = await supabase
            .from("experts")
            .select("id, name, specialty, image_url")
            .eq("approved", true);

          data = fallbackRows
            ? mapApprovedExperts(fallbackRows, fallbackExperts)
            : [];
        } else {
          data = approvedRows
            ? mapApprovedExperts(approvedRows, fallbackExperts)
            : [];
        }
      }

      if (isMounted) {
        setExperts(data);
        setSelectedExpertId(data[0]?.id ?? null);
      }
    }

    void loadExperts();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredExperts = useMemo(
    () => {
      const matchingExperts = experts.filter((expert) => {
        const keyword = search.trim().toLowerCase();
        const matchesCategory = activeCategories.includes(expert.category);
        const matchesSearch =
          keyword.length === 0 ||
          expert.nickname.toLowerCase().includes(keyword) ||
          expert.profession.toLowerCase().includes(keyword) ||
          expert.category.toLowerCase().includes(keyword);

        return matchesCategory && matchesSearch;
      });

      return sortPremiumFirst(matchingExperts);
    },
    [activeCategories, experts, search]
  );
  const selectedExpert =
    filteredExperts.find((expert) => expert.id === selectedExpertId) ??
    filteredExperts[0] ??
    null;

  function toggleCategory(category: ExpertCategory) {
    setActiveCategories((current) => {
      const next = current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category];

      return next.length > 0 ? next : allCategoryLabels;
    });
  }

  function useDeviceLocation() {
    if (!navigator.geolocation) {
      setLocationLabel("Current location");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => setLocationLabel("Using your current location"),
      () => setLocationLabel("Current location")
    );
  }

  function selectExpert(expert: ExpertDiscoveryProfile) {
    setSelectedExpertId(expert.id);
    void trackAnalyticsEvent({
      eventName: "expert_view",
      page: "/experts",
      metadata: {
        expert_id: expert.id,
        expert_name: expert.nickname,
        category: expert.category,
        source: "radar_marker",
      },
    });
  }

  return (
    <main className="min-h-screen bg-[#F5F1E8] text-[#161616]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-lg font-extrabold tracking-[0.18em] text-[#111111]"
          >
            TRUPICK
          </Link>
          <button
            type="button"
            onClick={useDeviceLocation}
            className="rounded-full border border-[#ddd8ce] bg-white px-4 py-2 text-sm font-bold text-[#31312d] shadow-sm transition hover:border-[#161616]"
          >
            Use my location
          </button>
        </header>

        <section className="pt-12 text-center lg:pt-16">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#ff5a5f]">
            Nearby experts
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl text-[clamp(3rem,9vw,6.2rem)] font-black leading-[0.9] text-[#111111]">
            Find talent by distance.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base font-bold leading-8 text-[#4B5563] sm:text-lg">
            가까운 검증 전문가를 탐색하고, category와 distance를 기준으로 가장
            잘 맞는 사람을 빠르게 선택하세요.
          </p>

          <div className="mx-auto mt-7 inline-flex rounded-[8px] border border-[#ded8ce] bg-white px-4 py-3 text-left shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7b766d]">
                  Center
                </p>
                <p className="mt-1 text-sm font-black text-[#111111]">
                  {locationLabel}
                </p>
          </div>
        </section>

        <section className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="min-w-0">
            <section className="rounded-[8px] border border-[#E5E7EB] bg-[#FFFFFF] p-4 shadow-[0_18px_60px_rgba(24,24,20,0.06)] backdrop-blur sm:p-5">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff5a5f]">
                    Categories
                  </p>
                  <h2 className="mt-1 text-xl font-black text-[#111111]">
                    필요한 분야를 선택하세요
                  </h2>
                </div>
                {initialCategory ? (
                  <Link
                    href="/experts"
                    className="shrink-0 rounded-full border border-[#ded8ce] bg-white px-3 py-2 text-xs font-black text-[#4d4a44] transition hover:border-[#111111]"
                  >
                  전체 보기
                  </Link>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {expertCategories.map((category) => {
                  const isActive = activeCategories.includes(category.label);

                  return (
                    <Link
                      key={category.label}
                      href={getCategoryHref(category.label)}
                      className={`rounded-[8px] border p-3 text-left transition hover:-translate-y-0.5 hover:border-[#111111] ${
                        isActive
                          ? "border-[#111111] bg-[#FFFFFF]"
                          : "border-[#E5E7EB] bg-[#FFFFFF]"
                      }`}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111111] text-xs font-black text-white">
                        {category.icon}
                      </span>
                      <span className="mt-3 block text-sm font-bold text-[#111111]">
                        {category.label}
                      </span>
                      <span className="mt-1 block text-xs font-bold leading-5 text-[#4B5563]">
                        {category.description}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="닉네임, 직업, 카테고리 검색"
                className="min-h-12 flex-1 rounded-full border border-[#ded8ce] bg-white px-5 text-sm font-bold text-[#111111] shadow-sm outline-none transition placeholder:text-[#9a9489] focus:border-[#111111]"
              />
              <div className="rounded-full border border-[#ded8ce] bg-white px-5 py-3 text-sm font-black text-[#111111] shadow-sm">
                {filteredExperts.length}명 표시
              </div>
            </div>

            <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              {expertCategories.map((category) => {
                const isActive = activeCategories.includes(category.label);

                return (
                  <button
                    key={category.label}
                    type="button"
                    onClick={() => toggleCategory(category.label)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-black transition ${
                      isActive
                        ? "border-[#111111] bg-[#111111] text-white shadow-sm"
                        : "border-[#E5E7EB] bg-[#FFFFFF] text-[#4B5563] hover:border-[#111111]"
                    }`}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="lg:sticky lg:top-6">
            {selectedExpert ? (
              <div className="overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-[#FFFFFF] shadow-[0_24px_70px_rgba(24,24,20,0.12)] transition hover:-translate-y-[4px]">
                <div className="relative h-64 w-full">
                  <Image
                    src={selectedExpert.photoUrl}
                    alt={selectedExpert.nickname}
                    fill
                    sizes="(max-width: 1024px) 100vw, 360px"
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="p-5">
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#ff5a5f]">
                    Recommended
                  </p>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <p className="inline-flex rounded-full bg-[#fff1ec] px-3 py-1 text-sm font-black text-[#ee5d3f]">
                          {selectedExpert.category}
                        </p>
                        {selectedExpert.planType === "premium" ? (
                          <p className="inline-flex rounded-full bg-[#111111] px-3 py-1 text-sm font-black text-white">
                            ✓ PREMIUM
                          </p>
                        ) : null}
                        {getProfileCompleteness({
                          photoUrl: selectedExpert.photoUrl,
                          description: selectedExpert.description,
                          career: selectedExpert.career,
                          certifications: selectedExpert.certifications,
                          location: selectedExpert.location,
                          consultation_methods:
                            selectedExpert.consultationMethods,
                          sns_url: selectedExpert.snsUrl,
                          portfolio_url: selectedExpert.portfolioUrl,
                        }).score >= 90 ? (
                          <p className="inline-flex rounded-full bg-[#E8F2EC] px-3 py-1 text-sm font-black text-[#0F5132]">
                            COMPLETE PROFILE
                          </p>
                        ) : null}
                      </div>
                      <h2 className="mt-1 text-3xl font-bold text-[#111111]">
                        {selectedExpert.nickname}
                      </h2>
                    </div>
                    <div className="rounded-full bg-[#f3f0e8] px-3 py-2 text-sm font-black text-[#111111]">
                      {selectedExpert.rating.toFixed(2)}
                    </div>
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-[8px] bg-[#f7f5ef] p-4">
                      <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#817b71]">
                        Profession
                      </dt>
                      <dd className="mt-2 text-sm font-black text-[#171717]">
                        {selectedExpert.profession}
                      </dd>
                    </div>
                    <div className="rounded-[8px] bg-[#f7f5ef] p-4">
                      <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#817b71]">
                        Distance
                      </dt>
                      <dd className="mt-2 text-sm font-black text-[#171717]">
                        {formatDistance(selectedExpert.distanceMeters)}
                      </dd>
                    </div>
                  </dl>

                  <Link
                    href={`/experts/${selectedExpert.id}`}
                    className="mt-5 block w-full rounded-full bg-[#111111] px-5 py-4 text-center text-sm font-black text-white transition hover:bg-[#333333]"
                  >
                    프로필 자세히 보기
                  </Link>
                  <Link
                    href="/request"
                    className="mt-2 block w-full rounded-full bg-[#0F5132] px-5 py-4 text-center text-sm font-black text-white transition hover:bg-[#146C43]"
                  >
                    Request consultation
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-[8px] border border-[#E5E7EB] bg-[#FFFFFF] p-6 text-sm font-bold text-[#4B5563]">
                조건에 맞는 전문가가 없습니다.
              </div>
            )}
          </aside>
        </section>

        <section className="mt-10 pb-14">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff5a5f]">
                Radar
              </p>
              <h2 className="mt-1 text-2xl font-black text-[#111111]">
                거리 기반 전문가 탐색
              </h2>
            </div>
            <p className="text-sm font-bold text-[#4B5563]">
              500m · 1km · 3km · 5km
            </p>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-3xl overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-[#f1efe8] shadow-[0_24px_80px_rgba(24,24,20,0.10)] sm:aspect-[1.55/1]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.9)_24%,rgba(242,239,230,0.78)_58%,rgba(227,222,210,0.94)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(35,35,31,0.048)_1px,transparent_1px),linear-gradient(90deg,rgba(35,35,31,0.048)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#20201d]/10" />
            <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#20201d]/10" />

            {distanceRings.map((ring) => {
              const size = `${(ring.meters / maxRadarDistance) * 88}%`;

              return (
                <div
                  key={ring.label}
                  className="absolute left-1/2 top-1/2 rounded-full border border-[#24231f]/20"
                  style={{
                    width: size,
                    height: size,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <span className="absolute -right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-black text-[#6d685f] shadow-sm">
                    {ring.label}
                  </span>
                </div>
              );
            })}

            <div className="absolute left-1/2 top-1/2 z-20 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[5px] border-white bg-[#ff5a5f] text-xs font-black text-white shadow-[0_16px_42px_rgba(255,90,95,0.34)]">
              You
            </div>

            {filteredExperts.map((expert) => {
              const isSelected = selectedExpert?.id === expert.id;

              return (
                <button
                  key={expert.id}
                  type="button"
                  aria-label={`${expert.nickname}, ${expert.profession}`}
                  onClick={() => selectExpert(expert)}
                  className={`absolute z-30 h-11 w-11 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-[3px] bg-white shadow-[0_12px_30px_rgba(18,18,16,0.20)] transition hover:scale-110 sm:h-12 sm:w-12 ${
                    isSelected
                      ? "border-[#ff5a5f] ring-4 ring-[#ff5a5f]/20"
                      : "border-white"
                  }`}
                  style={getMarkerPosition(expert)}
                >
                  <Image
                    src={expert.photoUrl}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                  {expert.planType === "premium" ? (
                    <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-[#111111]" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

function ExpertsSearchParamBoundary() {
  const searchParams = useSearchParams();
  const requestedCategory = searchParams.get("category");
  const initialCategory = isExpertCategory(requestedCategory)
    ? requestedCategory
    : null;

  return (
    <ExpertsDiscoveryContent
      key={initialCategory ?? "all"}
      initialCategory={initialCategory}
    />
  );
}

export default function ExpertsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F5F1E8] px-4 py-8 text-[#161616]">
          <div className="mx-auto max-w-7xl rounded-[8px] border border-[#E5E7EB] bg-[#FFFFFF] p-6 text-sm font-black text-[#4B5563]">
            전문가 탐색을 준비하고 있습니다.
          </div>
        </main>
      }
    >
      <ExpertsSearchParamBoundary />
    </Suspense>
  );
}
