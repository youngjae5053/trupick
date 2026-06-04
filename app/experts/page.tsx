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
import FavoriteButton from "@/app/components/FavoriteButton";

type ApprovedExpertRow = {
  id: number;
  name: string;
  specialty: string;
  category?: ExpertCategory | null;
  plan_type?: "free" | "premium" | null;
  image_url?: string | null;
};

type ReviewStats = Record<number, { rating: number; reviewCount: number }>;

const distanceRings = [
  { label: "500m", meters: 500 },
  { label: "1km", meters: 1000 },
  { label: "3km", meters: 3000 },
  { label: "5km", meters: 5000 },
];

const maxRadarDistance = 5000;
const allCategoryLabels = expertCategoryLabels;

const subcategoryFilters: Record<ExpertCategory, string[]> = {
  "운동/재활": [
    "전체",
    "PT/퍼스널트레이닝",
    "재활운동",
    "체형교정",
    "필라테스",
    "스트레칭",
    "통증관리",
    "기능회복",
  ],
  세무: [
    "전체",
    "종합소득세",
    "부가세",
    "법인세",
    "사업자 세무",
    "프리랜서 세무",
    "세무조사",
    "절세 상담",
  ],
  법률: [
    "전체",
    "계약 검토",
    "민사",
    "형사",
    "노동",
    "부동산",
    "생활 법률",
    "창업 법률",
  ],
  "사진/영상": [
    "전체",
    "프로필 촬영",
    "제품 촬영",
    "숏폼 영상",
    "유튜브 편집",
    "웨딩/행사",
    "브랜드 콘텐츠",
  ],
  디자인: [
    "전체",
    "로고",
    "브랜딩",
    "상세페이지",
    "UI/UX",
    "포스터",
    "SNS 디자인",
  ],
  마케팅: [
    "전체",
    "인스타그램",
    "블로그",
    "퍼포먼스 광고",
    "콘텐츠 전략",
    "브랜딩",
    "상세페이지 기획",
  ],
  심리상담: [
    "전체",
    "관계 상담",
    "번아웃",
    "커리어 고민",
    "마음 건강",
    "스트레스 관리",
    "자존감",
  ],
};

const subcategoryKeywords: Record<string, string[]> = {
  "PT/퍼스널트레이닝": ["PT", "퍼스널", "트레이닝", "근력", "운동"],
  재활운동: ["재활", "회복", "운동"],
  체형교정: ["체형", "교정", "자세", "정렬"],
  필라테스: ["필라테스", "코어", "호흡"],
  스트레칭: ["스트레칭", "가동성", "유연성"],
  통증관리: ["통증", "어깨", "허리", "관리"],
  기능회복: ["기능", "회복", "재활"],
  종합소득세: ["종합소득세", "소득세", "신고"],
  부가세: ["부가세", "부가가치세"],
  법인세: ["법인세", "법인"],
  "사업자 세무": ["사업자", "세무", "신고"],
  "프리랜서 세무": ["프리랜서", "개인사업자", "소득세"],
  세무조사: ["세무조사", "조사", "대응"],
  "절세 상담": ["절세", "상담", "전략"],
  "계약 검토": ["계약", "검토", "자문"],
  민사: ["민사", "분쟁", "손해"],
  형사: ["형사", "고소", "사건"],
  노동: ["노동", "근로", "노무"],
  부동산: ["부동산", "임대차", "매매"],
  "생활 법률": ["생활", "법률", "상담"],
  "창업 법률": ["창업", "법률", "사업"],
  "프로필 촬영": ["프로필", "촬영"],
  "제품 촬영": ["제품", "촬영", "상업"],
  "숏폼 영상": ["숏폼", "릴스", "영상"],
  "유튜브 편집": ["유튜브", "편집", "영상"],
  "웨딩/행사": ["웨딩", "행사", "촬영"],
  "브랜드 콘텐츠": ["브랜드", "콘텐츠", "촬영"],
  로고: ["로고", "브랜드"],
  브랜딩: ["브랜딩", "브랜드", "아이덴티티"],
  상세페이지: ["상세페이지", "커머스", "페이지"],
  "UI/UX": ["UI", "UX", "웹", "모바일"],
  포스터: ["포스터", "시각", "그래픽"],
  "SNS 디자인": ["SNS", "인스타그램", "콘텐츠"],
  인스타그램: ["인스타그램", "SNS", "콘텐츠"],
  블로그: ["블로그", "콘텐츠", "검색"],
  "퍼포먼스 광고": ["퍼포먼스", "광고", "Meta", "Google"],
  "콘텐츠 전략": ["콘텐츠", "전략", "기획"],
  "상세페이지 기획": ["상세페이지", "기획", "전환"],
  "관계 상담": ["관계", "상담"],
  번아웃: ["번아웃", "스트레스", "회복"],
  "커리어 고민": ["커리어", "진로", "고민"],
  "마음 건강": ["마음", "심리", "건강"],
  "스트레스 관리": ["스트레스", "관리", "불안"],
  자존감: ["자존감", "자기", "마음"],
};

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

function matchesSubcategory(
  expert: ExpertDiscoveryProfile,
  subcategory: string
) {
  if (subcategory === "전체") {
    return true;
  }

  const normalizedText = [
    expert.nickname,
    expert.profession,
    expert.category,
    expert.description,
    expert.career,
    expert.location,
    ...expert.certifications,
    ...expert.specialtyTags,
  ]
    .join(" ")
    .toLowerCase();
  const keywords = subcategoryKeywords[subcategory] ?? [subcategory];

  return keywords.some((keyword) =>
    normalizedText.includes(keyword.toLowerCase())
  );
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
  fallbackExperts: ExpertDiscoveryProfile[],
  reviewStats: ReviewStats = {}
): ExpertDiscoveryProfile[] {
  return rows.map((expert, index) => {
    const fallback = fallbackExperts[index % fallbackExperts.length];
    const stats = reviewStats[expert.id];

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
      specialtyTags: fallback?.specialtyTags ?? [],
      consultationMethods: fallback?.consultationMethods ?? ["Online"],
      snsUrl: fallback?.snsUrl ?? null,
      portfolioUrl: fallback?.portfolioUrl ?? null,
      planType: expert.plan_type === "premium" ? "premium" : "free",
      rating: stats?.rating ?? 0,
      reviewCount: stats?.reviewCount ?? 0,
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
  const [activeCategory] = useState<ExpertCategory | null>(initialCategory);
  const [activeSubcategory, setActiveSubcategory] = useState("전체");
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
          .eq("approval_status", "approved");

        const { data: reviewRows } = await supabase
          .from("reviews")
          .select("expert_id, rating")
          .returns<Array<{ expert_id: number; rating: number }>>();

        const reviewStats =
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

        if (error) {
          const { data: fallbackRows } = await supabase
            .from("experts")
            .select("id, name, specialty, image_url")
            .eq("approved", true)
            .eq("approval_status", "approved");

          data = fallbackRows
            ? mapApprovedExperts(fallbackRows, fallbackExperts, reviewStats)
            : [];
        } else {
          data = approvedRows
            ? mapApprovedExperts(approvedRows, fallbackExperts, reviewStats)
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
        const matchesCategory = activeCategory
          ? expert.category === activeCategory
          : allCategoryLabels.includes(expert.category);
        const matchesDetail =
          !activeCategory || matchesSubcategory(expert, activeSubcategory);
        const matchesSearch =
          keyword.length === 0 ||
          expert.nickname.toLowerCase().includes(keyword) ||
          expert.profession.toLowerCase().includes(keyword) ||
          expert.category.toLowerCase().includes(keyword) ||
          expert.description.toLowerCase().includes(keyword) ||
          expert.location.toLowerCase().includes(keyword);

        return matchesCategory && matchesDetail && matchesSearch;
      });

      return sortPremiumFirst(matchingExperts);
    },
    [activeCategory, activeSubcategory, experts, search]
  );
  const selectedExpert =
    filteredExperts.find((expert) => expert.id === selectedExpertId) ??
    filteredExperts[0] ??
    null;

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

        <section className="mt-10 rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-[0_18px_60px_rgba(24,24,20,0.06)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F5132]">
                Search paths
              </p>
              <h2 className="mt-2 text-3xl font-black text-[#111111]">
                전문가를 찾는 2가지 방법
              </h2>
            </div>
            <p className="max-w-md text-sm font-bold leading-6 text-[#4B5563]">
              직접 조건을 고르거나, AI가 질문 기반으로 TOP3를 추천하게 할 수
              있습니다.
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <article className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-5">
              <span className="inline-flex rounded-full bg-[#0F5132] px-3 py-1 text-xs font-black text-white">
                직접 검색하기
              </span>
              <h3 className="mt-4 text-2xl font-black text-[#111111]">
                조건이 명확할 때
              </h3>
              <p className="mt-3 text-sm font-bold leading-7 text-[#374151]">
                원하는 분야나 지역을 직접 선택해서 전문가를 찾아보세요.
              </p>
              <ul className="mt-4 grid gap-2 text-sm font-bold text-[#111111]">
                <li>✓ 분야/지역/경력 필터 검색</li>
                <li>✓ 원하는 조건에 맞는 전문가 탐색</li>
                <li>✓ 빠르게 직접 비교 가능</li>
              </ul>
              <a
                href="#expert-search"
                className="mt-5 inline-flex rounded-full bg-[#0F5132] px-5 py-3 text-sm font-black text-white transition hover:bg-[#146C43]"
              >
                전문가 찾기
              </a>
            </article>

            <article className="rounded-[8px] border border-[#E9D7FE] bg-[#FBF7FF] p-5">
              <span className="inline-flex rounded-full bg-[#6D28D9] px-3 py-1 text-xs font-black text-white">
                AI 매칭 받기
              </span>
              <h3 className="mt-4 text-2xl font-black text-[#111111]">
                상황 설명이 필요할 때
              </h3>
              <p className="mt-3 text-sm font-bold leading-7 text-[#374151]">
                몇 가지 질문에 답하면 나에게 딱 맞는 전문가를 추천해드려요.
              </p>
              <ul className="mt-4 grid gap-2 text-sm font-bold text-[#111111]">
                <li>✓ 내 상황에 맞는 전문가 추천</li>
                <li>✓ 적합도 기반 TOP 3 추천</li>
                <li>✓ 매칭 이유와 함께 확인 가능</li>
              </ul>
              <Link
                href="/match"
                className="mt-5 inline-flex rounded-full bg-[#6D28D9] px-5 py-3 text-sm font-black text-white transition hover:bg-[#5B21B6]"
              >
                AI 매칭 시작하기
              </Link>
            </article>
          </div>

          <div className="mt-4 rounded-[8px] border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-bold leading-6 text-[#374151]">
            직접 검색과 AI 매칭을 명확히 분리하여 상황에 맞게 선택할 수
            있도록 개선했습니다.
          </div>
        </section>

        <section
          id="expert-search"
          className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start"
        >
          <div className="min-w-0">
            <section className="rounded-[8px] border border-[#E5E7EB] bg-[#FFFFFF] p-4 shadow-[0_18px_60px_rgba(24,24,20,0.06)] backdrop-blur sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[170px_minmax(0,1fr)]">
                <aside className="rounded-[8px] bg-[#FBFAF7] p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0F5132]">
                      Category
                    </p>
                    {activeCategory ? (
                      <Link
                        href="/experts"
                        className="text-xs font-black text-[#111111] underline underline-offset-4"
                      >
                        전체 보기
                      </Link>
                    ) : null}
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0">
                    {expertCategories.map((category) => {
                      const isActive = activeCategory === category.label;

                      return (
                        <Link
                          key={category.label}
                          href={getCategoryHref(category.label)}
                          className={`shrink-0 rounded-[8px] border px-3 py-2 text-sm font-black transition hover:border-[#111111] lg:w-full ${
                            isActive
                              ? "border-[#0F5132] bg-[#0F5132] text-white"
                              : "border-[#E5E7EB] bg-white text-[#111111]"
                          }`}
                        >
                          {category.label}
                        </Link>
                      );
                    })}
                  </div>
                </aside>

                <div className="min-w-0">
                  <div className="mb-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff5a5f]">
                        {activeCategory ? "Sub fields" : "Categories"}
                      </p>
                      <h2 className="mt-1 text-2xl font-black text-[#111111]">
                        {activeCategory
                          ? `${activeCategory} 전문가`
                          : "필요한 분야를 선택하세요"}
                      </h2>
                    </div>
                  </div>

                  {activeCategory ? (
                    <div className="flex flex-wrap gap-2">
                      {subcategoryFilters[activeCategory].map((subcategory) => {
                        const isActive = activeSubcategory === subcategory;

                        return (
                          <button
                            key={subcategory}
                            type="button"
                            onClick={() => setActiveSubcategory(subcategory)}
                            className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                              isActive
                                ? "border-[#111111] bg-[#111111] text-white"
                                : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#111111]"
                            }`}
                          >
                            {subcategory}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {expertCategories.map((category) => (
                        <Link
                          key={category.label}
                          href={getCategoryHref(category.label)}
                          className="rounded-[8px] border border-[#E5E7EB] bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-[#111111]"
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
                      ))}
                    </div>
                  )}
                </div>
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

            <div className="mt-4 rounded-[8px] border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-bold leading-6 text-[#4B5563] shadow-sm">
              {activeCategory
                ? `${activeCategory} 카테고리${
                    activeSubcategory === "전체"
                      ? " 전체"
                      : ` · ${activeSubcategory}`
                  } 기준으로 전문가를 보여줍니다.`
                : "전체 카테고리의 검증 전문가를 검색하고 비교할 수 있습니다."}
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
                      ★ {selectedExpert.rating.toFixed(2)}
                    </div>
                  </div>

                  {selectedExpert.planType === "premium" ? (
                    <div className="mt-4 rounded-[8px] border border-[#111111] bg-[#111111] p-4 text-white">
                      <p className="text-xs font-black uppercase tracking-[0.16em]">
                        Premium Expert
                      </p>
                      <p className="mt-2 text-sm font-bold leading-6">
                        프리미엄 플랜으로 상단 노출과 추천 우선권이 적용된 전문가입니다.
                      </p>
                    </div>
                  ) : null}

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
                    <div className="rounded-[8px] bg-[#f7f5ef] p-4">
                      <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#817b71]">
                        Reviews
                      </dt>
                      <dd className="mt-2 text-sm font-black text-[#171717]">
                        {selectedExpert.reviewCount}개
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 grid gap-2">
                    <div className="flex gap-2">
                      <Link
                        href={`/experts/${selectedExpert.id}`}
                        className="min-h-12 flex-1 rounded-full bg-[#111111] px-5 py-4 text-center text-sm font-black text-white transition hover:bg-[#333333]"
                      >
                        프로필 자세히 보기
                      </Link>
                      <FavoriteButton
                        expertId={selectedExpert.id}
                        size="compact"
                      />
                    </div>
                    <Link
                      href="/request"
                      className="block w-full rounded-full bg-[#0F5132] px-5 py-4 text-center text-sm font-black text-white transition hover:bg-[#146C43]"
                    >
                      Request consultation
                    </Link>
                  </div>
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
