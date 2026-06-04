"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { trackAnalyticsEvent } from "@/app/analytics";
import {
  ExpertCategory,
  expertCategories,
  isExpertCategory,
} from "@/app/expertCategories";
import {
  ExpertDiscoveryProfile,
  getNearbyExperts,
} from "@/app/experts/expertDiscoveryData";
import { getProfileCompleteness } from "@/app/profileCompleteness";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

type MatchAnswers = {
  need: ExpertCategory | "";
  concern: string;
  goal: string;
  budget: string;
  region: string;
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
};

type MatchResult = MatchCandidate & {
  score: number;
  reason: string;
  scoreParts: {
    category: number;
    region: number;
    specialty: number;
    rating: number;
    completeness: number;
  };
};

type ReviewStats = Record<number, { rating: number; reviewCount: number }>;

const initialAnswers: MatchAnswers = {
  need: "",
  concern: "",
  goal: "",
  budget: "",
  region: "",
};

const budgetOptions = [
  "10만원 이하",
  "10~30만원",
  "30~50만원",
  "50만원 이상",
  "상담 후 결정",
];

const categoryKeywords: Record<ExpertCategory, string[]> = {
  "운동/재활": [
    "운동",
    "재활",
    "통증",
    "체형",
    "교정",
    "근력",
    "어깨",
    "허리",
    "자세",
  ],
  세무: ["세무", "세금", "절세", "신고", "사업자", "부가세", "소득세"],
  법률: ["법률", "계약", "분쟁", "변호", "소송", "자문", "합의"],
  "사진/영상": ["사진", "영상", "촬영", "편집", "프로필", "콘텐츠"],
  디자인: ["디자인", "브랜드", "로고", "UI", "웹", "시각", "포트폴리오"],
  마케팅: ["마케팅", "광고", "퍼널", "전환", "콘텐츠", "성장", "캠페인"],
  심리상담: ["심리", "상담", "관계", "불안", "스트레스", "마음"],
};

const fallbackImage =
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=480&q=80";

function formatDistance(meters: number) {
  return meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
}

function deriveCategory(value: string | null | undefined): ExpertCategory {
  const text = value || "";

  if (isExpertCategory(text)) {
    return text;
  }

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

function getKeywordScore(answers: MatchAnswers, expert: MatchCandidate) {
  const answerText = `${answers.concern} ${answers.goal} ${answers.need}`;
  const expertText = `${expert.profession} ${expert.description} ${expert.career}`;
  const keywords = [
    ...categoryKeywords[expert.category],
    ...answerText
      .split(/[\s,./·]+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 2),
  ];
  const uniqueKeywords = Array.from(new Set(keywords));
  const matchedCount = uniqueKeywords.filter((keyword) =>
    normalizeText(expertText).includes(normalizeText(keyword))
  ).length;

  return Math.min(20, matchedCount * 4);
}

function getRegionScore(region: string, expertLocation: string) {
  if (!region.trim()) {
    return 8;
  }

  const target = normalizeText(region);
  const location = normalizeText(expertLocation);

  if (location.includes(target) || target.includes(location)) {
    return 20;
  }

  const shortTarget = target.slice(0, 2);

  return shortTarget && location.includes(shortTarget) ? 14 : 4;
}

function buildReason(answers: MatchAnswers, expert: MatchCandidate) {
  const goal = answers.goal.trim() || answers.concern.trim() || "현재 목표";
  const categoryReason =
    expert.category === answers.need
      ? "요청한 카테고리와 정확히 일치하고"
      : "인접한 전문성을 보유하고";
  const regionReason = getRegionScore(answers.region, expert.location) >= 14;

  return `${goal}에 맞춰 ${categoryReason}, ${expert.profession} 경험이 풍부한 전문가입니다.${
    regionReason ? " 선호 지역과도 가까워 상담 연결 가능성이 높습니다." : ""
  }`;
}

function calculateMatches(
  answers: MatchAnswers,
  experts: MatchCandidate[]
): MatchResult[] {
  return experts
    .map((expert) => {
      const category = expert.category === answers.need ? 30 : 8;
      const region = getRegionScore(answers.region, expert.location);
      const specialty = getKeywordScore(answers, expert);
      const rating = Math.min(15, Math.round((expert.rating / 5) * 15));
      const completeness = Math.min(
        15,
        Math.round((expert.completenessScore / 100) * 15)
      );
      const rawScore = category + region + specialty + rating + completeness;

      return {
        ...expert,
        score: Math.min(99, rawScore),
        reason: buildReason(answers, expert),
        scoreParts: {
          category,
          region,
          specialty,
          rating,
          completeness,
        },
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(b.planType === "premium") - Number(a.planType === "premium") ||
        b.rating - a.rating
    )
    .slice(0, 3);
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
    };
  });
}

function ScoreRing({ score }: { score: number }) {
  return (
    <div
      className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(#0F5132 ${score * 3.6}deg, #E7E1D6 0deg)`,
      }}
      aria-label={`적합도 ${score}%`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
        <span className="text-xl font-black text-[#111111]">{score}%</span>
      </div>
    </div>
  );
}

export default function MatchPage() {
  const [answers, setAnswers] = useState<MatchAnswers>(initialAnswers);
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [submittedAnswers, setSubmittedAnswers] =
    useState<MatchAnswers | null>(null);
  const [loadingExperts, setLoadingExperts] = useState(true);
  const [saveState, setSaveState] = useState("");
  const [downloadState, setDownloadState] = useState("PDF 다운로드");

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

  const generatedAt = useMemo(
    () =>
      new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date()),
    []
  );

  const bestResult = results[0];

  function updateAnswer(key: keyof MatchAnswers, value: string) {
    setAnswers((current) => ({
      ...current,
      [key]: key === "need" && isExpertCategory(value) ? value : value,
    }));
    setSaveState("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!answers.need || !answers.concern || !answers.goal || !answers.budget) {
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
        category: answers.need,
        budget: answers.budget,
        region: answers.region || null,
      },
    });

    void trackAnalyticsEvent({
      eventName: "ai_match_completed",
      page: "/match",
      metadata: {
        top_score: nextResults[0]?.score ?? null,
        top_expert: nextResults[0]?.name ?? null,
        category: nextResults[0]?.category ?? answers.need,
      },
    });
  }

  function handlePdfDownload() {
    setDownloadState("준비 완료");
    window.alert("PDF 다운로드는 곧 제공될 예정입니다.");
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
                AI matching
              </p>
              <h1 className="mt-3 max-w-4xl text-[clamp(2.6rem,10vw,5.4rem)] font-black leading-[0.98] tracking-normal text-[#111111] sm:tracking-[-0.04em]">
                나에게 맞는 전문가를 찾아보세요.
              </h1>
              <p className="mt-5 max-w-2xl text-base font-bold leading-8 text-[#374151] sm:text-lg">
                몇 가지 질문에 답하면 카테고리, 지역, 전문 분야, 평점, 프로필
                완성도를 기준으로 적합한 전문가 TOP3를 추천합니다.
              </p>
            </div>

            <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-[0_18px_60px_rgba(30,28,24,0.08)]">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#374151]">
                Report date
              </p>
              <p className="mt-2 text-lg font-black">{generatedAt}</p>
              <button
                type="button"
                onClick={handlePdfDownload}
                className="mt-4 w-full rounded-full bg-[#0F5132] px-5 py-3 text-sm font-black text-white transition hover:bg-[#146C43]"
              >
                {downloadState}
              </button>
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
              상담 목표 입력
            </h2>

            <div className="mt-6 grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-black text-[#111111]">
                  어떤 도움이 필요한가요?
                </span>
                <select
                  value={answers.need}
                  onChange={(event) => updateAnswer("need", event.target.value)}
                  className="w-full rounded-[8px] border border-[#D9CFBF] bg-white px-4 py-3 text-sm font-bold text-[#111111] outline-none transition focus:border-[#0F5132]"
                  required
                >
                  <option value="">카테고리를 선택해주세요</option>
                  {expertCategories.map((category) => (
                    <option key={category.label} value={category.label}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-[#111111]">
                  현재 가장 큰 고민은?
                </span>
                <textarea
                  value={answers.concern}
                  onChange={(event) =>
                    updateAnswer("concern", event.target.value)
                  }
                  rows={3}
                  placeholder="예: 어깨 통증과 체형 불균형이 반복됩니다."
                  className="w-full resize-none rounded-[8px] border border-[#D9CFBF] bg-white px-4 py-3 text-sm font-bold text-[#111111] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#0F5132]"
                  required
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-[#111111]">목표는?</span>
                <input
                  value={answers.goal}
                  onChange={(event) => updateAnswer("goal", event.target.value)}
                  placeholder="예: 체형교정과 통증 없는 운동 루틴 만들기"
                  className="w-full rounded-[8px] border border-[#D9CFBF] bg-white px-4 py-3 text-sm font-bold text-[#111111] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#0F5132]"
                  required
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-[#111111]">
                  예산 범위는?
                </span>
                <select
                  value={answers.budget}
                  onChange={(event) => updateAnswer("budget", event.target.value)}
                  className="w-full rounded-[8px] border border-[#D9CFBF] bg-white px-4 py-3 text-sm font-bold text-[#111111] outline-none transition focus:border-[#0F5132]"
                  required
                >
                  <option value="">예산 범위를 선택해주세요</option>
                  {budgetOptions.map((budget) => (
                    <option key={budget} value={budget}>
                      {budget}
                    </option>
                  ))}
                </select>
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
            </div>

            <button
              type="submit"
              disabled={loadingExperts}
              className="mt-6 w-full rounded-full bg-[#0F5132] px-6 py-4 text-sm font-black text-white shadow-[0_14px_40px_rgba(15,81,50,0.20)] transition hover:bg-[#146C43] disabled:cursor-not-allowed disabled:bg-[#9CA3AF]"
            >
              {loadingExperts ? "전문가 데이터를 불러오는 중" : "AI 매칭 시작하기"}
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
              점수는 이렇게 계산됩니다.
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ["카테고리 일치", "30점"],
                ["지역 일치", "20점"],
                ["전문 분야 일치", "20점"],
                ["평점", "15점"],
                ["프로필 완성도", "15점"],
              ].map(([label, score]) => (
                <div
                  key={label}
                  className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-4"
                >
                  <p className="text-sm font-black text-[#111111]">{label}</p>
                  <p className="mt-2 text-3xl font-black text-[#0F5132]">
                    {score}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[8px] bg-[#111111] p-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white">
                Answer storage
              </p>
              <p className="mt-3 text-sm font-bold leading-7 text-white">
                제출한 답변은 현재 브라우저에 저장되어 다음 상담 요청이나
                리포트 개선에 활용할 수 있도록 준비했습니다.
              </p>
            </div>
          </div>
        </section>

        {submittedAnswers && bestResult ? (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0F5132]">
                  사용자의 목표
                </p>
                <p className="mt-3 text-xl font-black leading-7">
                  {submittedAnswers.goal}
                </p>
              </div>
              <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0F5132]">
                  현재 상태 요약
                </p>
                <p className="mt-3 text-sm font-bold leading-7 text-[#374151]">
                  {submittedAnswers.concern}
                </p>
              </div>
              <div className="rounded-[8px] border border-[#E5E7EB] bg-[#111111] p-5 text-white shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white">
                  Match confidence
                </p>
                <p className="mt-3 text-5xl font-black">{bestResult.score}%</p>
                <p className="mt-2 text-sm font-bold leading-6 text-white">
                  {bestResult.category} 분야에서 가장 높은 적합도를 보입니다.
                </p>
              </div>
            </section>

            <section className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_22px_70px_rgba(30,28,24,0.08)] sm:p-8">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F5132]">
                  AI 분석 결과
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-normal">
                  {submittedAnswers.need} 전문가 중 실행 가능성이 높은 조합입니다.
                </h2>
                <p className="mt-5 text-base font-bold leading-8 text-[#374151]">
                  예산은 {submittedAnswers.budget}, 선호 지역은{" "}
                  {submittedAnswers.region || "무관"}으로 입력되었습니다. 현재
                  고민과 목표를 기준으로 전문 분야 키워드가 잘 맞고, 평점과
                  프로필 완성도가 높은 전문가를 우선 추천했습니다.
                </p>
                <div className="mt-6 rounded-[8px] bg-[#FBFAF7] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0F5132]">
                    추천 이유
                  </p>
                  <p className="mt-3 text-lg font-black leading-8">
                    {bestResult.reason}
                  </p>
                </div>
              </div>

              <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-4 shadow-[0_22px_70px_rgba(30,28,24,0.08)] sm:p-5">
                <div className="mb-4 flex items-end justify-between gap-4 px-1">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F5132]">
                      Top 3 experts
                    </p>
                    <h2 className="mt-2 text-2xl font-black">
                      적합한 전문가 TOP3
                    </h2>
                  </div>
                  <span className="rounded-full bg-[#F5F1E8] px-3 py-2 text-xs font-black text-[#374151]">
                    AI 추천
                  </span>
                </div>

                <div className="grid gap-3">
                  {results.map((expert, index) => (
                    <article
                      key={expert.id}
                      className="grid gap-4 rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-4 sm:grid-cols-[96px_minmax(0,1fr)_80px] sm:items-center"
                    >
                      <Link
                        href={`/experts/${expert.id}`}
                        className="relative h-24 w-24 overflow-hidden rounded-[8px] bg-[#EBE7DF]"
                      >
                        <Image
                          src={expert.photoUrl}
                          alt={expert.name}
                          fill
                          unoptimized
                          sizes="96px"
                          className="object-cover"
                        />
                      </Link>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#111111]">
                            TOP {index + 1}
                          </span>
                          <span className="rounded-full bg-[#FFF1EC] px-3 py-1 text-xs font-black text-[#D65339]">
                            {expert.category}
                          </span>
                          {expert.planType === "premium" ? (
                            <span className="rounded-full bg-[#111111] px-3 py-1 text-xs font-black text-white">
                              PREMIUM
                            </span>
                          ) : null}
                        </div>
                        <Link href={`/experts/${expert.id}`}>
                          <h3 className="mt-3 text-xl font-black text-[#111111]">
                            {expert.name}
                          </h3>
                        </Link>
                        <p className="mt-1 text-sm font-black text-[#374151]">
                          {expert.profession} · {expert.location}
                        </p>
                        <p className="mt-3 text-sm font-bold leading-6 text-[#4B5563]">
                          {expert.reason}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-[#374151]">
                          <span className="rounded-full bg-white px-3 py-2">
                            ★ {expert.rating.toFixed(1)}
                          </span>
                          <span className="rounded-full bg-white px-3 py-2">
                            후기 {expert.reviewCount}개
                          </span>
                          <span className="rounded-full bg-white px-3 py-2">
                            완성도 {expert.completenessScore}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:block">
                        <ScoreRing score={expert.score} />
                        <Link
                          href={`/experts/${expert.id}`}
                          className="text-sm font-black text-[#0F5132] underline underline-offset-4 sm:mt-2 sm:block sm:text-center"
                        >
                          상세보기
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
