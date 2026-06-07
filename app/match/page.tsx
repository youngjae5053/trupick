"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { trackAnalyticsEvent } from "@/app/analytics";
import ConsultationRequestFlow from "@/app/components/ConsultationRequestFlow";
import { ExpertCategory } from "@/app/expertCategories";
import {
  ExpertDiscoveryProfile,
  getNearbyExperts,
} from "@/app/experts/expertDiscoveryData";
import { getProfileCompleteness } from "@/app/profileCompleteness";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

type MatchAnswers = {
  concern: string;
  experience: string;
  goal: string;
  region: string;
  method: string;
};

type ExpertRow = {
  id: number;
  name: string;
  specialty: string;
  location: string;
  description: string | null;
  career: string | null;
  image_url: string | null;
  plan_type: "free" | "premium" | null;
  category?: string | null;
  certifications?: string[] | string | null;
  consultation_methods?: string[] | string | null;
  sns_url?: string | null;
  portfolio_url?: string | null;
  portfolio?: string[] | string | null;
};

type MatchCandidate = {
  id: number;
  name: string;
  category: ExpertCategory;
  profession: string;
  location: string;
  description: string;
  career: string;
  photoUrl: string;
  rating: number;
  reviewCount: number;
  completenessScore: number;
  planType: "free" | "premium";
  distance: string;
  consultationMethods: string[];
};

type MatchResult = MatchCandidate & {
  score: number;
  reason: string;
};

type ReviewStats = Record<number, { rating: number; reviewCount: number }>;

const initialAnswers: MatchAnswers = {
  concern: "",
  experience: "",
  goal: "",
  region: "",
  method: "",
};

const concernOptions = [
  "어깨 통증",
  "허리 통증",
  "체형교정",
  "다이어트",
  "근력향상",
  "러닝",
  "재활",
];

const experienceOptions = ["초보", "6개월 미만", "1년 이상", "3년 이상"];
const methodOptions = ["센터 방문", "온라인", "방문 상담", "상관없음"];

const concernKeywords: Record<string, string[]> = {
  "어깨 통증": ["어깨", "견갑", "회전근개", "상체", "통증"],
  "허리 통증": ["허리", "요통", "코어", "골반", "통증"],
  체형교정: ["체형", "자세", "교정", "라운드숄더", "골반"],
  다이어트: ["다이어트", "체중", "감량", "식습관", "체지방"],
  근력향상: ["근력", "근육", "웨이트", "파워", "강화"],
  러닝: ["러닝", "달리기", "마라톤", "보행", "지구력"],
  재활: ["재활", "기능회복", "통증", "운동처방", "회복"],
};

const fallbackImage =
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=480&q=80";

function formatDistance(meters: number) {
  return meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
}

function deriveCategory(value: string | null | undefined): ExpertCategory {
  const text = value || "";

  if (/운동|재활|트레이너|체형|통증|필라테스/.test(text)) {
    return "운동/재활";
  }

  if (/세무|세금|절세|소득세|부가세/.test(text)) {
    return "세무";
  }

  if (/법률|계약|변호|분쟁|소송/.test(text)) {
    return "법률";
  }

  if (/사진|영상|촬영|편집/.test(text)) {
    return "사진/영상";
  }

  if (/디자인|브랜드|UI|로고/.test(text)) {
    return "디자인";
  }

  if (/마케팅|광고|퍼널|캠페인/.test(text)) {
    return "마케팅";
  }

  if (/심리|상담|마음|관계/.test(text)) {
    return "심리상담";
  }

  return "운동/재활";
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s/g, "");
}

function normalizeArray(value: string[] | string | null | undefined) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[,/·]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getKeywordScore(answers: MatchAnswers, expert: MatchCandidate) {
  const answerText = `${answers.concern} ${answers.goal}`;
  const expertText = `${expert.profession} ${expert.description} ${expert.career}`;
  const keywords = [
    ...(concernKeywords[answers.concern] ?? []),
    ...answerText
      .split(/[\s,./·]+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 2),
  ];
  const uniqueKeywords = Array.from(new Set(keywords));
  const matchedCount = uniqueKeywords.filter((keyword) =>
    normalizeText(expertText).includes(normalizeText(keyword))
  ).length;

  return Math.min(38, matchedCount * 7);
}

function getRegionScore(region: string, expertLocation: string) {
  if (!region.trim()) {
    return 10;
  }

  const target = normalizeText(region);
  const location = normalizeText(expertLocation);

  if (location.includes(target) || target.includes(location)) {
    return 18;
  }

  const shortTarget = target.slice(0, 2);

  return shortTarget && location.includes(shortTarget) ? 12 : 3;
}

function buildReason(answers: MatchAnswers, expert: MatchCandidate) {
  const goal = answers.goal.trim() || answers.concern.trim() || "현재 목표";
  const keywordScore = getKeywordScore(answers, expert);
  const regionReason = getRegionScore(answers.region, expert.location) >= 14;
  const methodReason =
    answers.method === "상관없음" ||
    expert.consultationMethods.some((method) => method.includes(answers.method));
  const premiumReason =
    expert.planType === "premium"
      ? " TRUPICK Premium 전문가라 추천 노출 가산점도 반영했습니다."
      : "";

  return `${answers.concern} 고민과 ${goal} 목표에 맞춰 ${expert.profession} 경험을 우선 반영했습니다. ${
    keywordScore >= 21
      ? "전문 분야와 소개에 관련 키워드가 잘 맞습니다."
      : "상담 전 현재 상태를 구체적으로 공유하면 더 정확한 방향을 받을 수 있습니다."
  } ${regionReason ? "선호 지역과도 가까워 연결 가능성이 높습니다." : ""} ${
    methodReason ? "원하는 상담 방식도 대응 가능합니다." : ""
  }${premiumReason}`.replace(/\s+/g, " ");
}

function calculateMatches(
  answers: MatchAnswers,
  experts: MatchCandidate[]
): MatchResult[] {
  return experts
    .map((expert) => {
      const region = getRegionScore(answers.region, expert.location);
      const specialty = getKeywordScore(answers, expert);
      const method =
        answers.method === "상관없음" ||
        expert.consultationMethods.length === 0 ||
        expert.consultationMethods.some((methodItem) =>
          methodItem.includes(answers.method)
        )
          ? 12
          : 3;
      const rating = Math.min(12, Math.round((expert.rating / 5) * 12));
      const completeness = Math.min(
        10,
        Math.round((expert.completenessScore / 100) * 10)
      );
      const premium = expert.planType === "premium" ? 8 : 0;
      const rawScore = 18 + region + specialty + method + rating + completeness + premium;

      return {
        ...expert,
        score: Math.min(99, rawScore),
        reason: buildReason(answers, expert),
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(b.planType === "premium") - Number(a.planType === "premium") ||
        b.rating - a.rating
    )
    .filter((expert) => expert.score >= 35)
    .slice(0, 5);
}

function mapMockExperts(experts: ExpertDiscoveryProfile[]): MatchCandidate[] {
  return experts.map((expert) => ({
    id: expert.id,
    name: expert.nickname,
    category: expert.category,
    profession: expert.profession,
    location: expert.location,
    description: expert.description,
    career: expert.career,
    photoUrl: expert.photoUrl,
    rating: expert.rating,
    reviewCount: expert.reviewCount,
    completenessScore: getProfileCompleteness({
      photoUrl: expert.photoUrl,
      description: expert.description,
      career: expert.career,
      certifications: expert.certifications,
      location: expert.location,
      consultation_methods: expert.consultationMethods,
      sns_url: expert.snsUrl,
      portfolio_url: expert.portfolioUrl,
    }).score,
    planType: expert.planType,
    distance: formatDistance(expert.distanceMeters),
    consultationMethods: expert.consultationMethods,
  }));
}

function mapExpertRows(
  rows: ExpertRow[],
  mockExperts: ExpertDiscoveryProfile[],
  reviewStats: ReviewStats
): MatchCandidate[] {
  return rows.map((expert, index) => {
    const mock = mockExperts[index % mockExperts.length];
    const stats = reviewStats[expert.id];

    return {
      id: expert.id,
      name: expert.name,
      category: deriveCategory(expert.category || expert.specialty),
      profession: expert.specialty,
      location: expert.location,
      description: expert.description || "상담 목표에 맞춰 실행 가능한 방향을 제안합니다.",
      career: expert.career || "TRUPICK 검증 전문가",
      photoUrl: expert.image_url || mock?.photoUrl || fallbackImage,
      rating: stats?.rating ?? 0,
      reviewCount: stats?.reviewCount ?? 0,
      completenessScore: getProfileCompleteness({
        image_url: expert.image_url,
        description: expert.description,
        career: expert.career,
        certifications: expert.certifications,
        location: expert.location,
        consultation_methods: expert.consultation_methods,
        sns_url: expert.sns_url,
        portfolio_url: expert.portfolio_url,
        portfolio: expert.portfolio,
      }).score,
      planType: expert.plan_type === "premium" ? "premium" : "free",
      distance: mock ? formatDistance(mock.distanceMeters) : "상담 가능",
      consultationMethods: normalizeArray(expert.consultation_methods),
    };
  });
}

export default function MatchPage() {
  const [answers, setAnswers] = useState<MatchAnswers>(initialAnswers);
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [submittedAnswers, setSubmittedAnswers] =
    useState<MatchAnswers | null>(null);
  const [loadingExperts, setLoadingExperts] = useState(true);
  const [saveState, setSaveState] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadExperts() {
      const mockExperts = await getNearbyExperts();
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        if (isMounted) {
          setCandidates(mapMockExperts(mockExperts));
          setLoadingExperts(false);
        }
        return;
      }

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
              (current.rating * current.reviewCount + review.rating) / nextCount,
            reviewCount: nextCount,
          };

          return stats;
        }, {}) ?? {};

      const { data, error } = await supabase
        .from("experts")
        .select(
          "id, name, specialty, location, description, career, image_url, plan_type, category, certifications, consultation_methods, sns_url, portfolio_url, portfolio"
        )
        .eq("approved", true)
        .eq("approval_status", "approved")
        .returns<ExpertRow[]>();

      if (!isMounted) {
        return;
      }

      if (error || !data || data.length === 0) {
        setCandidates(mapMockExperts(mockExperts));
      } else {
        setCandidates(mapExpertRows(data, mockExperts, reviewStats));
      }

      setLoadingExperts(false);
    }

    void loadExperts();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateAnswer(key: keyof MatchAnswers, value: string) {
    setAnswers((current) => ({
      ...current,
      [key]: value,
    }));
    setSaveState("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!answers.concern || !answers.experience || !answers.goal || !answers.method) {
      setSaveState("필수 질문을 모두 입력해주세요.");
      return;
    }

    const nextResults = calculateMatches(answers, candidates);

    localStorage.setItem("trupick_match_answers", JSON.stringify(answers));
    setSubmittedAnswers(answers);
    setResults(nextResults);
    setSaveState("답변이 저장되었습니다.");

    void trackAnalyticsEvent({
      eventName: "ai_match_started",
      page: "/match",
      metadata: {
        concern: answers.concern,
        experience: answers.experience,
        method: answers.method,
        region: answers.region || null,
      },
    });

    void trackAnalyticsEvent({
      eventName: "ai_match_completed",
      page: "/match",
      metadata: {
        top_score: nextResults[0]?.score ?? null,
        top_expert: nextResults[0]?.name ?? null,
        concern: answers.concern,
      },
    });
  }

  return (
    <main className="min-h-screen bg-[#F5F1E8] text-[#111111]">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="text-lg font-black tracking-[0.18em] text-[#111111]"
          >
            TRUPICK
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/experts"
              className="rounded-full border border-[#D9CFBF] bg-white px-4 py-2 text-sm font-black text-[#0F5132] shadow-sm transition hover:border-[#111111]"
            >
              전문가 탐색
            </Link>
            <Link
              href="/mypage"
              className="rounded-full bg-[#111111] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#333333]"
            >
              마이페이지
            </Link>
          </div>
        </header>

        <section className="pt-10 sm:pt-14">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#0F5132]">
                Fitness Expert Finder
              </p>
              <h1 className="mt-3 max-w-4xl text-[clamp(2.6rem,10vw,5.4rem)] font-black leading-[0.98] tracking-normal text-[#111111] sm:tracking-[-0.04em]">
                운동 고민에 맞는 전문가를 추천해드려요.
              </h1>
              <p className="mt-5 max-w-2xl text-base font-bold leading-8 text-[#374151] sm:text-lg">
                어깨 통증, 허리 통증, 체형교정, 다이어트 같은 현재 고민과
                목표를 입력하면 바로 상담 신청까지 이어지는 전문가 3~5명을
                추천합니다.
              </p>
            </div>

            <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-[0_18px_60px_rgba(30,28,24,0.08)]">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#374151]">
                Recommendation
              </p>
              <p className="mt-2 text-3xl font-black text-[#111111]">3~5명</p>
              <p className="mt-3 text-sm font-bold leading-6 text-[#374151]">
                검증 완료 전문가 중 고민 키워드, 지역, 상담 방식, Premium 여부를
                함께 반영합니다.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-[0_22px_70px_rgba(30,28,24,0.08)] sm:p-7"
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F5132]">
              Matching questions
            </p>
            <h2 className="mt-3 text-3xl font-black text-[#111111]">
              고민과 목표 입력
            </h2>

            <div className="mt-6 grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-black text-[#111111]">
                  현재 고민
                </span>
                <select
                  value={answers.concern}
                  onChange={(event) =>
                    updateAnswer("concern", event.target.value)
                  }
                  className="w-full rounded-[8px] border border-[#D9CFBF] bg-white px-4 py-3 text-sm font-bold text-[#111111] outline-none transition focus:border-[#0F5132]"
                  required
                >
                  <option value="">고민을 선택해주세요</option>
                  {concernOptions.map((concern) => (
                    <option key={concern} value={concern}>
                      {concern}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-[#111111]">
                  운동 경험
                </span>
                <select
                  value={answers.experience}
                  onChange={(event) =>
                    updateAnswer("experience", event.target.value)
                  }
                  className="w-full rounded-[8px] border border-[#D9CFBF] bg-white px-4 py-3 text-sm font-bold text-[#111111] outline-none transition focus:border-[#0F5132]"
                  required
                >
                  <option value="">운동 경험을 선택해주세요</option>
                  {experienceOptions.map((experience) => (
                    <option key={experience} value={experience}>
                      {experience}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-[#111111]">
                  원하는 목표
                </span>
                <input
                  value={answers.goal}
                  onChange={(event) => updateAnswer("goal", event.target.value)}
                  placeholder="예: 통증 없이 운동 루틴 만들기"
                  className="w-full rounded-[8px] border border-[#D9CFBF] bg-white px-4 py-3 text-sm font-bold text-[#111111] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#0F5132]"
                  required
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-[#111111]">
                  선호 지역은?
                </span>
                <input
                  value={answers.region}
                  onChange={(event) => updateAnswer("region", event.target.value)}
                  placeholder="예: 서울 강남구, 성수동, 온라인"
                  className="w-full rounded-[8px] border border-[#D9CFBF] bg-white px-4 py-3 text-sm font-bold text-[#111111] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#0F5132]"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-[#111111]">
                  상담 방식
                </span>
                <select
                  value={answers.method}
                  onChange={(event) => updateAnswer("method", event.target.value)}
                  className="w-full rounded-[8px] border border-[#D9CFBF] bg-white px-4 py-3 text-sm font-bold text-[#111111] outline-none transition focus:border-[#0F5132]"
                  required
                >
                  <option value="">상담 방식을 선택해주세요</option>
                  {methodOptions.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="submit"
              disabled={loadingExperts}
              className="mt-6 w-full rounded-full bg-[#0F5132] px-6 py-4 text-sm font-black text-white shadow-[0_14px_40px_rgba(15,81,50,0.20)] transition hover:bg-[#146C43] disabled:cursor-not-allowed disabled:bg-[#9CA3AF]"
            >
              {loadingExperts ? "전문가 데이터를 불러오는 중" : "전문가 찾기"}
            </button>
            {saveState ? (
              <p className="mt-3 text-sm font-bold text-[#0F5132]">{saveState}</p>
            ) : null}
          </form>

          <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-[0_22px_70px_rgba(30,28,24,0.08)] sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F5132]">
              Matching logic
            </p>
            <h2 className="mt-3 text-3xl font-black text-[#111111]">
              이런 기준으로 추천합니다.
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ["고민 키워드", "specialty·description"],
                ["지역 적합도", "선호 지역 반영"],
                ["상담 방식", "센터/온라인/방문"],
                ["Premium", "소폭 가산"],
              ].map(([label, score]) => (
                <div
                  key={label}
                  className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-4"
                >
                  <p className="text-sm font-black text-[#111111]">{label}</p>
                  <p className="mt-2 text-base font-black leading-6 text-[#0F5132]">
                    {score}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[8px] bg-[#111111] p-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white">
                Verified only
              </p>
              <p className="mt-3 text-sm font-bold leading-7 text-white">
                승인 완료된 전문가만 추천합니다. 결과 카드에서 바로 프로필을
                확인하거나 무료 상담 신청을 시작할 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        {submittedAnswers && results.length > 0 ? (
          <section className="mt-8 rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-[0_24px_80px_rgba(30,28,24,0.08)] sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F5132]">
                  Recommended experts
                </p>
                <h2 className="mt-3 text-3xl font-black text-[#111111] sm:text-4xl">
                  회원님의 고민과 목표에 맞는 전문가를 추천했어요.
                </h2>
                <p className="mt-4 max-w-3xl text-base font-bold leading-8 text-[#374151]">
                  {submittedAnswers.concern} 고민과 “{submittedAnswers.goal}”
                  목표를 기준으로 추천했습니다. 운동 경험은{" "}
                  {submittedAnswers.experience}, 상담 방식은{" "}
                  {submittedAnswers.method}으로 반영했습니다.
                </p>
              </div>
              <Link
                href="/experts"
                className="inline-flex shrink-0 justify-center rounded-full border border-[#D9CFBF] bg-[#F5F1E8] px-5 py-3 text-sm font-black text-[#0F5132] transition hover:border-[#0F5132]"
              >
                전체 전문가 보기
              </Link>
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {results.map((expert, index) => (
                <article
                  key={expert.id}
                  className="overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(30,28,24,0.12)]"
                >
                  <Link
                    href={`/experts/${expert.id}`}
                    className="relative block aspect-[4/3] bg-[#EBE7DF]"
                  >
                    <Image
                      src={expert.photoUrl}
                      alt={expert.name}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#111111] shadow-sm">
                        추천 {index + 1}
                      </span>
                      <span className="rounded-full bg-[#0F5132] px-3 py-1.5 text-xs font-black text-white shadow-sm">
                        VERIFIED
                      </span>
                      {expert.planType === "premium" ? (
                        <span className="rounded-full bg-[#111111] px-3 py-1.5 text-xs font-black text-white shadow-sm">
                          Premium
                        </span>
                      ) : null}
                    </div>
                  </Link>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/experts/${expert.id}`}>
                          <h3 className="truncate text-2xl font-black text-[#111111]">
                            {expert.name}
                          </h3>
                        </Link>
                        <p className="mt-1 text-sm font-black text-[#374151]">
                          {expert.profession}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#E8F2EC] px-3 py-1.5 text-xs font-black text-[#0F5132]">
                        추천 점수 {expert.score}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm font-bold text-[#374151]">
                      <p>지역: {expert.location}</p>
                      <p>경력: {expert.career}</p>
                    </div>

                    <div className="mt-5 rounded-[8px] bg-[#FBFAF7] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0F5132]">
                        추천 이유
                      </p>
                      <p className="mt-2 text-sm font-bold leading-6 text-[#374151]">
                        {expert.reason}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-[#374151]">
                      <span className="rounded-full border border-[#E5E7EB] px-3 py-2">
                        ★ {expert.rating.toFixed(1)}
                      </span>
                      <span className="rounded-full border border-[#E5E7EB] px-3 py-2">
                        후기 {expert.reviewCount}개
                      </span>
                      <span className="rounded-full border border-[#E5E7EB] px-3 py-2">
                        {expert.distance}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-2">
                      <Link
                        href={`/experts/${expert.id}`}
                        className="inline-flex w-full justify-center rounded-full border border-[#D9CFBF] bg-white px-5 py-3 text-sm font-black text-[#111111] transition hover:border-[#111111]"
                      >
                        프로필 보기
                      </Link>
                      <ConsultationRequestFlow
                        expertId={expert.id}
                        expertName={expert.name}
                        triggerLabel="상담 신청"
                        triggerClassName="block w-full rounded-full bg-[#0F5132] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-[#146C43]"
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {submittedAnswers && results.length === 0 ? (
          <section className="mt-8 rounded-[8px] border border-[#E5E7EB] bg-white p-6 text-center shadow-[0_24px_80px_rgba(30,28,24,0.08)] sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F5132]">
              No exact match
            </p>
            <h2 className="mt-3 text-3xl font-black text-[#111111]">
              조건을 넓혀 다시 추천해보세요.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base font-bold leading-8 text-[#374151]">
              현재 입력한 고민, 지역, 상담 방식에 정확히 맞는 전문가가
              부족합니다. 지역을 넓히거나 상담 방식을 “상관없음”으로 변경하면
              더 많은 전문가를 추천받을 수 있습니다.
            </p>
            <Link
              href="/experts"
              className="mt-6 inline-flex rounded-full bg-[#0F5132] px-6 py-3 text-sm font-black text-white transition hover:bg-[#146C43]"
            >
              전체 전문가 보기
            </Link>
          </section>
        ) : null}
      </div>
    </main>
  );
}
