"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  ExpertDiscoveryProfile,
  getNearbyExperts,
} from "./expertDiscoveryData";
import {
  ExpertCategory,
  isExpertCategory,
} from "@/app/expertCategories";
import { trackAnalyticsEvent } from "@/app/analytics";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";
import { getProfileCompleteness } from "@/app/profileCompleteness";
import FavoriteButton from "@/app/components/FavoriteButton";
import KakaoExpertMap from "@/app/components/KakaoExpertMap";
import ConsultationRequestFlow from "@/app/components/ConsultationRequestFlow";

type ApprovedExpertRow = {
  id: number;
  name: string;
  specialty: string;
  category?: ExpertCategory | null;
  plan_type?: "free" | "premium" | null;
  image_url?: string | null;
};

type ReviewStats = Record<number, { rating: number; reviewCount: number }>;

const mapDistanceFilters = [
  { label: "1km 이내", meters: 1000 },
  { label: "3km 이내", meters: 3000 },
  { label: "5km 이내", meters: 5000 },
  { label: "10km 이내", meters: 10000 },
];

const fitnessCategory: ExpertCategory = "운동/재활";
const recommendationFields = [
  "통증관리",
  "재활운동",
  "체형교정",
  "다이어트",
  "근력향상",
  "러닝",
  "기타",
];
const recommendationMethods = ["센터 방문", "온라인", "방문 상담", "상관없음"];

const subcategoryFilters: Record<ExpertCategory, string[]> = {
  "운동/재활": [
    "전체",
    "재활운동",
    "통증관리",
    "체형교정",
    "다이어트",
    "근력향상",
    "파워리프팅",
    "필라테스",
    "러닝",
    "시니어 운동",
    "산전산후 운동",
    "스포츠 퍼포먼스",
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
  다이어트: ["다이어트", "체중", "감량", "체지방"],
  근력향상: ["근력", "근비대", "웨이트", "트레이닝"],
  파워리프팅: ["파워리프팅", "스쿼트", "데드리프트", "벤치프레스"],
  러닝: ["러닝", "달리기", "마라톤", "주법"],
  "시니어 운동": ["시니어", "고령", "낙상", "기능회복"],
  "산전산후 운동": ["산전", "산후", "임산부", "골반"],
  "스포츠 퍼포먼스": ["스포츠", "퍼포먼스", "선수", "민첩"],
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

function formatConsultationMethods(methods: string[]) {
  const labels: Record<string, string> = {
    Visit: "방문",
    Online: "온라인",
    Center: "센터",
  };

  return methods.map((method) => labels[method] ?? method).join(" / ");
}

function sortPremiumFirst(experts: ExpertDiscoveryProfile[]) {
  return [...experts].sort((a, b) => {
    if (a.planType !== b.planType) {
      return a.planType === "premium" ? -1 : 1;
    }

    return b.rating - a.rating;
  });
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/\s/g, "");
}

function buildRecommendationText(expert: ExpertDiscoveryProfile) {
  return [
    expert.nickname,
    expert.profession,
    expert.category,
    expert.description,
    expert.career,
    expert.location,
    ...expert.certifications,
    ...expert.specialtyTags,
    ...expert.consultationMethods,
  ].join(" ");
}

function getRecommendationReason({
  expert,
  field,
  location,
  method,
}: {
  expert: ExpertDiscoveryProfile;
  field: string;
  location: string;
  method: string;
}) {
  const locationMatched =
    location.trim().length > 0 &&
    normalizeSearchText(expert.location).includes(normalizeSearchText(location));
  const methodMatched =
    method === "상관없음" ||
    expert.consultationMethods.some((item) =>
      formatConsultationMethods([item]).includes(method)
    );
  const fieldLabel = field === "기타" ? "입력한 상황" : field;

  return `${fieldLabel} 요청과 현재 상황 설명을 기준으로 ${expert.profession} 경험을 우선 반영했습니다. ${
    locationMatched ? "선호 지역과도 잘 맞습니다." : "지역 조건을 넓히면 더 많은 선택지도 볼 수 있습니다."
  } ${methodMatched ? "선호 상담 방식도 대응 가능합니다." : "상담 방식은 프로필에서 추가 확인해보세요."}`;
}

function getRecommendations({
  experts,
  field,
  situation,
  location,
  method,
}: {
  experts: ExpertDiscoveryProfile[];
  field: string;
  situation: string;
  location: string;
  method: string;
}) {
  const situationWords = situation
    .split(/[\s,./·]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2);
  const fieldKeywords = field === "기타" ? [] : subcategoryKeywords[field] ?? [field];

  return experts
    .map((expert) => {
      const normalizedText = normalizeSearchText(buildRecommendationText(expert));
      const fieldScore = fieldKeywords.some((keyword) =>
        normalizedText.includes(normalizeSearchText(keyword))
      )
        ? 32
        : 8;
      const situationScore = Math.min(
        24,
        situationWords.filter((word) =>
          normalizedText.includes(normalizeSearchText(word))
        ).length * 8
      );
      const locationScore =
        location.trim().length === 0
          ? 8
          : normalizeSearchText(expert.location).includes(
              normalizeSearchText(location)
            )
          ? 18
          : 3;
      const methodScore =
        method === "상관없음" ||
        expert.consultationMethods.some((item) =>
          formatConsultationMethods([item]).includes(method)
        )
          ? 10
          : 2;
      const premiumScore = expert.planType === "premium" ? 8 : 0;
      const ratingScore = Math.min(8, Math.round((expert.rating / 5) * 8));
      const completenessScore = Math.min(
        8,
        Math.round(
          (getProfileCompleteness({
            photoUrl: expert.photoUrl,
            description: expert.description,
            career: expert.career,
            certifications: expert.certifications,
            location: expert.location,
            consultation_methods: expert.consultationMethods,
            sns_url: expert.snsUrl,
            portfolio_url: expert.portfolioUrl,
          }).score /
            100) *
            8
        )
      );
      const recommendationScore =
        fieldScore +
        situationScore +
        locationScore +
        methodScore +
        premiumScore +
        ratingScore +
        completenessScore;

      return {
        ...expert,
        recommendationScore,
        recommendationReason: getRecommendationReason({
          expert,
          field,
          location,
          method,
        }),
      };
    })
    .filter((expert) => expert.recommendationScore >= 34)
    .sort(
      (a, b) =>
        b.recommendationScore - a.recommendationScore ||
        Number(b.planType === "premium") - Number(a.planType === "premium") ||
        b.rating - a.rating
    )
    .slice(0, 5);
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

function isFitnessExpert(expert: ExpertDiscoveryProfile) {
  const text = [
    expert.nickname,
    expert.profession,
    expert.category,
    expert.description,
    expert.career,
    ...expert.specialtyTags,
  ].join(" ");

  return (
    expert.category === fitnessCategory ||
    text.includes("운동") ||
    text.includes("재활") ||
    text.includes("트레이너") ||
    text.includes("필라테스") ||
    text.includes("통증") ||
    text.includes("체형")
  );
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
  initialQuery,
}: {
  initialCategory: ExpertCategory | null;
  initialQuery: string;
}) {
  const [experts, setExperts] = useState<ExpertDiscoveryProfile[]>([]);
  const [activeCategory] = useState<ExpertCategory>(
    initialCategory === fitnessCategory ? initialCategory : fitnessCategory
  );
  const [activeSubcategory, setActiveSubcategory] = useState("전체");
  const [selectedExpertId, setSelectedExpertId] = useState<number | null>(null);
  const [locationSearch, setLocationSearch] = useState("");
  const [search, setSearch] = useState(initialQuery);
  const [maxDistanceFilter, setMaxDistanceFilter] = useState(10_000);
  const [recommendationField, setRecommendationField] = useState("통증관리");
  const [situation, setSituation] = useState("");
  const [preferredMethod, setPreferredMethod] = useState("상관없음");
  const [recommendations, setRecommendations] = useState<
    Array<
      ExpertDiscoveryProfile & {
        recommendationScore: number;
        recommendationReason: string;
      }
    >
  >([]);
  const [recommendationRequested, setRecommendationRequested] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadExperts() {
      const fallbackExperts = await getNearbyExperts();
      const fitnessFallbackExperts = fallbackExperts.filter(isFitnessExpert);
      const supabase = getSupabaseBrowserClient();
      let data = fitnessFallbackExperts;

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
            ? mapApprovedExperts(
                fallbackRows,
                fitnessFallbackExperts,
                reviewStats
              ).filter(isFitnessExpert)
            : [];
        } else {
          data = approvedRows
            ? mapApprovedExperts(
                approvedRows,
                fitnessFallbackExperts,
                reviewStats
              ).filter(isFitnessExpert)
            : [];
        }
      }

      if (data.length === 0) {
        data = fitnessFallbackExperts;
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
        const matchesCategory = isFitnessExpert(expert);
        const matchesDetail = matchesSubcategory(expert, activeSubcategory);
        const matchesDistance = expert.distanceMeters <= maxDistanceFilter;
        const matchesSearch =
          keyword.length === 0 ||
          expert.nickname.toLowerCase().includes(keyword) ||
          expert.profession.toLowerCase().includes(keyword) ||
          expert.category.toLowerCase().includes(keyword) ||
          expert.description.toLowerCase().includes(keyword) ||
          expert.location.toLowerCase().includes(keyword);

        return matchesCategory && matchesDetail && matchesDistance && matchesSearch;
      });

      return sortPremiumFirst(matchingExperts);
    },
    [activeSubcategory, experts, maxDistanceFilter, search]
  );
  const selectedExpert =
    filteredExperts.find((expert) => expert.id === selectedExpertId) ??
    filteredExperts[0] ??
    null;

  function requestRecommendations() {
    const nextRecommendations = getRecommendations({
      experts,
      field: recommendationField,
      situation,
      location: locationSearch,
      method: preferredMethod,
    });

    setRecommendationRequested(true);
    setRecommendations(nextRecommendations);
    setActiveSubcategory(recommendationField === "기타" ? "전체" : recommendationField);
    setSearch(situation);
  }

  const selectExpert = useCallback((expert: ExpertDiscoveryProfile) => {
    setSelectedExpertId(expert.id);
    void trackAnalyticsEvent({
      eventName: "expert_view",
      page: "/experts",
      metadata: {
        expert_id: expert.id,
        expert_name: expert.nickname,
        category: expert.category,
        source: "expert_discovery",
      },
    });
  }, []);

  return (
    <main className="min-h-screen bg-[#F6F3EC] text-[#161616]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-lg font-extrabold tracking-[0.18em] text-[#111111]"
          >
            TRUPICK
          </Link>
          <Link
            href="/how-we-verify"
            className="rounded-full border border-[#ddd8ce] bg-white px-4 py-2 text-sm font-bold text-[#31312d] shadow-sm transition hover:border-[#161616]"
          >
            Standards
          </Link>
        </header>

        <section className="pt-12 text-center lg:pt-16">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#0F5132]">
            검증 운동 전문가
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl text-[clamp(2.8rem,9vw,5.8rem)] font-black leading-[0.94] text-[#111111]">
            운동/재활 전문가 찾기
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base font-bold leading-8 text-[#4B5563] sm:text-lg">
            내 목표와 현재 상태에 맞는 검증된 운동 전문가를 찾아보세요.
          </p>

        </section>

        <section className="mt-10 rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-[0_18px_60px_rgba(24,24,20,0.06)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F5132]">
                전문가 추천
              </p>
              <h2 className="mt-2 text-3xl font-black text-[#111111]">
                나에게 맞는 전문가 찾기
              </h2>
            </div>
            <p className="max-w-md text-sm font-bold leading-6 text-[#4B5563]">
              필요한 도움을 선택하거나 상황을 간단히 적어주세요. TRUPICK이
              적합한 전문가를 추천해드립니다.
            </p>
          </div>

          <div className="mt-6 grid gap-5">
            <div>
              <p className="text-sm font-black text-[#111111]">
                도움이 필요한 분야
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {recommendationFields.map((field) => {
                  const isActive = recommendationField === field;

                  return (
                    <button
                      key={field}
                      type="button"
                      onClick={() => setRecommendationField(field)}
                      className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                        isActive
                          ? "border-[#0F5132] bg-[#0F5132] text-white"
                          : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#111111]"
                      }`}
                    >
                      {field}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(240px,0.7fr)]">
              <label className="grid gap-2">
                <span className="text-sm font-black text-[#111111]">
                  상황 설명
                </span>
                <textarea
                  value={situation}
                  onChange={(event) => setSituation(event.target.value)}
                  rows={4}
                  placeholder="예: 어깨가 아프고 벤치프레스할 때 불편합니다."
                  className="w-full resize-none rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 py-3 text-sm font-bold leading-6 text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#0F5132]"
                />
              </label>

              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-black text-[#111111]">
                    지역
                  </span>
                  <input
                    value={locationSearch}
                    onChange={(event) => setLocationSearch(event.target.value)}
                    placeholder="예: 강남, 서초, 송파"
                    className="min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#0F5132]"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-black text-[#111111]">
                    상담 방식
                  </span>
                  <select
                    value={preferredMethod}
                    onChange={(event) => setPreferredMethod(event.target.value)}
                    className="min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none focus:border-[#0F5132]"
                  >
                    {recommendationMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={requestRecommendations}
                className="rounded-full bg-[#0F5132] px-6 py-4 text-sm font-black text-white transition hover:bg-[#146C43]"
              >
                전문가 추천받기
              </button>
              <a
                href="#expert-search"
                className="rounded-full border border-[#D9CFBF] bg-white px-6 py-4 text-center text-sm font-black text-[#111111] transition hover:border-[#111111]"
              >
                전체 전문가 둘러보기
              </a>
            </div>
          </div>
        </section>

        {recommendationRequested ? (
          <section className="mt-6 rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
            {recommendations.length > 0 ? (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F5132]">
                      Recommended
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-[#111111]">
                      회원님의 상황에 맞는 전문가를 추천했어요.
                    </h2>
                  </div>
                  <p className="text-sm font-bold text-[#4B5563]">
                    {recommendations.length}명 추천
                  </p>
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                  {recommendations.map((expert) => (
                    <article
                      key={expert.id}
                      className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#E5E7EB]">
                          <Image
                            src={expert.photoUrl}
                            alt={expert.nickname}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-[#E8F2EC] px-3 py-1 text-xs font-black text-[#0F5132]">
                              VERIFIED
                            </span>
                            {expert.planType === "premium" ? (
                              <span className="rounded-full bg-[#111111] px-3 py-1 text-xs font-black text-white">
                                PREMIUM
                              </span>
                            ) : null}
                          </div>
                          <h3 className="mt-3 text-xl font-black text-[#111111]">
                            {expert.nickname}
                          </h3>
                          <p className="mt-1 text-sm font-bold text-[#374151]">
                            {expert.profession}
                          </p>
                          <p className="mt-1 text-sm font-black text-[#111111]">
                            {expert.location}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 rounded-[8px] bg-white p-4">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0F5132]">
                          추천 이유
                        </p>
                        <p className="mt-2 text-sm font-bold leading-6 text-[#374151]">
                          {expert.recommendationReason}
                        </p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-[#374151]">
                        <span className="rounded-full bg-white px-3 py-2">
                          추천 점수 {expert.recommendationScore}
                        </span>
                        <span className="rounded-full bg-white px-3 py-2">
                          ★ {expert.rating.toFixed(1)}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-2">
                        <Link
                          href={`/experts/${expert.id}`}
                          className="rounded-full border border-[#D9CFBF] bg-white px-4 py-3 text-center text-sm font-black text-[#111111] transition hover:border-[#111111]"
                        >
                          프로필 보기
                        </Link>
                        <ConsultationRequestFlow
                          expertId={expert.id}
                          expertName={expert.nickname}
                          triggerLabel="상담 신청"
                          triggerClassName="block w-full rounded-full bg-[#0F5132] px-4 py-3 text-center text-sm font-black text-white transition hover:bg-[#146C43]"
                        />
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-[8px] bg-[#FBFAF7] p-6 text-center">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F5132]">
                  No match
                </p>
                <h2 className="mt-2 text-3xl font-black text-[#111111]">
                  조건을 조금 넓혀 다시 검색해보세요.
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm font-bold leading-7 text-[#4B5563]">
                  지역을 넓히거나 상담 방식을 “상관없음”으로 변경하면 더 많은
                  전문가를 추천받을 수 있습니다.
                </p>
              </div>
            )}
          </section>
        ) : null}

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
                      Fitness beta
                    </p>
                  </div>
                  <div className="rounded-[8px] border border-[#0F5132] bg-[#0F5132] px-3 py-3 text-sm font-black text-white">
                    운동/재활
                  </div>
                  <div className="mt-3 grid gap-2 text-xs font-bold leading-5 text-[#4B5563]">
                    <p>베타 기간에는 운동/재활 전문가만 노출합니다.</p>
                    <p>통증, 자세, 체력, 스포츠 목표에 맞춰 비교하세요.</p>
                  </div>
                </aside>

                <div className="min-w-0">
                  <div className="mb-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff5a5f]">
                        Detail fields
                      </p>
                      <h2 className="mt-1 text-2xl font-black text-[#111111]">
                        운동/재활 세부 분야
                      </h2>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {subcategoryFilters[fitnessCategory].map((subcategory) => {
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

                  <div className="mt-5 flex flex-wrap gap-2">
                    {mapDistanceFilters.map((filter) => {
                      const isActive = maxDistanceFilter === filter.meters;

                      return (
                        <button
                          key={filter.meters}
                          type="button"
                          onClick={() => setMaxDistanceFilter(filter.meters)}
                          className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                            isActive
                              ? "border-[#0F5132] bg-[#0F5132] text-white"
                              : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#111111]"
                          }`}
                        >
                          {filter.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                    {["지역", "거리", "평점", "후기 수", "상담 방식"].map((filter) => (
                      <div
                        key={filter}
                        className="rounded-[8px] border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-black text-[#111111]"
                      >
                        {filter}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="닉네임, 운동 목표, 세부 분야 검색"
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
                : "운동/재활 분야의 검증 전문가를 검색하고 비교할 수 있습니다."}
            </div>

            <div className="mt-5 grid gap-3">
              {filteredExperts.map((expert) => (
                <article
                  key={expert.id}
                  className={`rounded-[8px] border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 ${
                    selectedExpert?.id === expert.id
                      ? "border-[#0F5132]"
                      : "border-[#E5E7EB]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectExpert(expert)}
                    className="flex w-full items-start gap-4 text-left"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#E5E7EB]">
                      <Image
                        src={expert.photoUrl}
                        alt={expert.nickname}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black text-[#111111]">
                          {expert.nickname}
                        </h3>
                        {expert.planType === "premium" ? (
                          <span className="rounded-full bg-[#111111] px-2 py-1 text-[10px] font-black text-white">
                            PREMIUM
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm font-bold text-[#374151]">
                        {expert.profession}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                        <span className="rounded-full bg-[#F5F1E8] px-3 py-2 text-[#111111]">
                          {expert.location}
                        </span>
                        <span className="rounded-full bg-[#E8F2EC] px-3 py-2 text-[#0F5132]">
                          {formatDistance(expert.distanceMeters)}
                        </span>
                        <span className="rounded-full bg-[#FFF7ED] px-3 py-2 text-[#9A3412]">
                          {formatConsultationMethods(expert.consultationMethods)}
                        </span>
                      </div>
                    </div>
                  </button>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Link
                      href={`/experts/${expert.id}`}
                      className="rounded-full bg-[#111111] px-4 py-3 text-center text-sm font-black text-white transition hover:bg-[#333333]"
                    >
                      상세페이지 이동
                    </Link>
                    <button
                      type="button"
                      onClick={() => selectExpert(expert)}
                      className="rounded-full border border-[#D9CFBF] bg-white px-4 py-3 text-sm font-black text-[#111111] transition hover:border-[#111111]"
                    >
                      프로필 열기
                    </button>
                  </div>
                </article>
              ))}
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
                        Location
                      </dt>
                      <dd className="mt-2 text-sm font-black text-[#171717]">
                        {selectedExpert.location}
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
                    <div className="rounded-[8px] bg-[#f7f5ef] p-4">
                      <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#817b71]">
                        Method
                      </dt>
                      <dd className="mt-2 text-sm font-black text-[#171717]">
                        {formatConsultationMethods(selectedExpert.consultationMethods)}
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
                    <ConsultationRequestFlow
                      expertId={selectedExpert.id}
                      expertName={selectedExpert.nickname}
                      triggerLabel="상담 신청"
                      triggerClassName="block w-full rounded-full bg-[#0F5132] px-5 py-4 text-center text-sm font-black text-white transition hover:bg-[#146C43]"
                    />
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

        <KakaoExpertMap
          experts={filteredExperts}
          selectedExpertId={selectedExpert?.id ?? null}
          onSelectExpert={selectExpert}
        />

      </div>
    </main>
  );
}

function ExpertsSearchParamBoundary() {
  const searchParams = useSearchParams();
  const requestedCategory = searchParams.get("category");
  const initialQuery = searchParams.get("q") ?? "";
  const initialCategory = isExpertCategory(requestedCategory)
    ? requestedCategory
    : null;

  return (
    <ExpertsDiscoveryContent
      key={`${initialCategory === fitnessCategory ? initialCategory : fitnessCategory}-${initialQuery}`}
      initialCategory={
        initialCategory === fitnessCategory ? initialCategory : fitnessCategory
      }
      initialQuery={initialQuery}
    />
  );
}

export default function ExpertsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F6F3EC] px-4 py-8 text-[#161616]">
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
