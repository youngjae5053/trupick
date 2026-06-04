import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ConsultationRequestFlow from "@/app/components/ConsultationRequestFlow";
import ExpertViewAnalytics from "@/app/components/ExpertViewAnalytics";
import ExpertReviewsSection, {
  ExpertReview,
} from "@/app/components/ExpertReviewsSection";
import FavoriteButton from "@/app/components/FavoriteButton";
import {
  ExpertQnaAccordion,
  PreparedAlertButton,
} from "@/app/components/VerifiedExpertProfileActions";
import { getNearbyExperts } from "@/app/experts/expertDiscoveryData";
import { getProfileCompleteness } from "@/app/profileCompleteness";

type Expert = {
  id: number;
  name: string;
  specialty: string;
  location: string;
  description: string;
  career: string | null;
  image_url: string | null;
  plan_type: "free" | "premium" | null;
  approval_status?: string | null;
  rating?: number;
  review_count?: number;
  certifications?: string[];
  specialty_tags?: string[];
  consultation_methods?: string[];
  sns_url?: string | null;
  portfolio_url?: string | null;
};

const rating = 4.98;
const reviewCount = 127;

const fallbackImage =
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80";

function deriveCategory(specialty: string) {
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

  return "검증 전문가";
}

function getSpecialtyAreas(category: string) {
  if (category === "운동/재활") {
    return ["재활운동", "통증관리", "체형교정", "운동처방", "기능회복"];
  }

  if (category === "세무") {
    return ["종합소득세", "사업자 세무", "절세 전략", "신고 대행"];
  }

  if (category === "법률") {
    return ["계약 검토", "분쟁 상담", "생활 법률", "기업 자문"];
  }

  if (category === "사진/영상") {
    return ["프로필 촬영", "브랜드 영상", "콘텐츠 편집", "촬영 기획"];
  }

  if (category === "디자인") {
    return ["브랜드 디자인", "UI 디자인", "시각 디자인", "포트폴리오 개선"];
  }

  if (category === "마케팅") {
    return ["광고 운영", "콘텐츠 전략", "퍼널 개선", "성장 마케팅"];
  }

  return ["초기 상담", "문제 진단", "실행 계획", "후속 관리"];
}

function getExpertSpecialtyAreas(expert: Expert, category: string) {
  return expert.specialty_tags && expert.specialty_tags.length > 0
    ? expert.specialty_tags
    : getSpecialtyAreas(category);
}

function getExperienceItems(expert: Expert, category: string) {
  if (category === "운동/재활") {
    return ["병원 근무", "운동센터 운영", "TRUPICK 활동"];
  }

  return [
    `${expert.specialty} 전문 컨설턴트`,
    "TRUPICK 검증 전문가",
    expert.career || "고객 맞춤 상담 경력 8년",
  ];
}

function getCertificationItems(category: string) {
  if (category === "운동/재활") {
    return ["생활스포츠지도사", "운동처방사", "물리치료사"];
  }

  return ["TRUPICK Verified Expert", "Professional Consultation", "Quality Review"];
}

function getExpertCertificationItems(expert: Expert, category: string) {
  return expert.certifications && expert.certifications.length > 0
    ? expert.certifications
    : getCertificationItems(category);
}

function getOneLineIntro(category: string, specialty: string) {
  if (category === "운동/재활") {
    return "물리치료사 출신 재활 코치";
  }

  if (category === "세무") {
    return "사업자와 프리랜서를 위한 세무 파트너";
  }

  if (category === "법률") {
    return "복잡한 문제를 쉽게 정리하는 법률 전문가";
  }

  if (category === "사진/영상") {
    return "브랜드 이미지를 만드는 콘텐츠 크리에이터";
  }

  if (category === "디자인") {
    return "비즈니스 방향을 시각화하는 브랜드 디자이너";
  }

  if (category === "마케팅") {
    return "성과 지표를 개선하는 성장 마케팅 전문가";
  }

  if (category === "심리상담") {
    return "마음의 회복을 돕는 상담 전문가";
  }

  return `${specialty} 상담 전문가`;
}

function getConsultationCount(reviewTotal: number, expertId: number) {
  if (reviewTotal > 0) {
    return reviewTotal * 2 + 71;
  }

  return 80 + expertId * 13;
}

function getDistanceLabel(expertId: number) {
  const distances = ["1.4km", "890m", "1.8km", "2.2km", "3.1km", "4.6km"];
  return distances[(expertId - 1) % distances.length] ?? "1.4km";
}

function getTimelineItems(items: string[]) {
  const years = ["2015~", "2019~", "2023~"];

  return items.slice(0, 3).map((item, index) => ({
    year: years[index] ?? "2024~",
    title: item,
  }));
}

function Stars({ value = rating }: { value?: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(value)));

  return (
    <span aria-label={`${value}점`}>
      {"★".repeat(filled)}
      <span className="text-[#D1D5DB]">{"★".repeat(5 - filled)}</span>
    </span>
  );
}

const verificationItems = [
  {
    title: "신원 인증 완료",
    description: "실명 기반 계정과 연락 가능 정보를 확인했습니다.",
  },
  {
    title: "경력 검증 완료",
    description: "주요 경력과 활동 이력을 TRUPICK 기준으로 검토했습니다.",
  },
  {
    title: "자격증 검증 완료",
    description: "전문성을 보여주는 자격 정보와 면허 자료를 확인했습니다.",
  },
  {
    title: "인터뷰 검증 완료",
    description: "상담 방식, 전문 철학, 고객 응대 기준을 인터뷰로 점검했습니다.",
  },
  {
    title: "사례 검증 완료",
    description: "실제 상담 사례와 결과 중심의 개선 과정을 검토했습니다.",
  },
];

const caseStudies = [
  {
    title: "어깨 통증 개선",
    customer: "30대 남성",
    period: "8주",
    problem: "통증 NRS 8 → 2",
    process: "견갑 안정화와 회전근개 강화 프로그램 진행",
    result: "야간 통증 감소와 일상 움직임 회복",
  },
  {
    title: "체형 교정",
    customer: "20대 여성",
    period: "10주",
    problem: "라운드숄더와 골반 불균형",
    process: "호흡 패턴, 흉추 가동성, 하체 정렬을 단계별로 교정",
    result: "자세 유지 시간이 늘고 목·어깨 피로도가 감소",
  },
  {
    title: "다이어트/체중 감량",
    customer: "40대 직장인",
    period: "12주",
    problem: "체중 관리 실패와 낮은 운동 지속성",
    process: "생활 패턴에 맞춘 주 3회 운동 루틴과 식습관 코칭",
    result: "체지방률 개선과 지속 가능한 운동 습관 형성",
  },
];

const qnaItems = [
  {
    question: "이 분야에서 가장 흔한 오해는 무엇인가요?",
    answer:
      "빠른 효과만 보고 무리하게 강도를 높이면 문제가 반복될 수 있습니다. 먼저 원인과 생활 패턴을 이해한 뒤 지속 가능한 계획을 세우는 것이 중요합니다.",
  },
  {
    question: "초보자가 가장 먼저 알아야 할 것은 무엇인가요?",
    answer:
      "현재 상태를 정확히 아는 것이 출발점입니다. TRUPICK 검증 전문가는 상담 초기에 목표, 제약, 경험을 함께 정리해 현실적인 다음 단계를 제안합니다.",
  },
  {
    question: "좋은 전문가를 고르는 기준은 무엇인가요?",
    answer:
      "경력과 자격뿐 아니라 설명 방식, 응답 속도, 실제 사례, 고객 후기까지 함께 보는 것이 좋습니다. 고객이 이해하고 선택할 수 있게 돕는 전문가를 추천합니다.",
  },
];

async function getMockExpert(id: number): Promise<Expert | null> {
  const mockExpert = (await getNearbyExperts()).find((expert) => expert.id === id);

  if (!mockExpert) {
    return null;
  }

  return {
    id: mockExpert.id,
    name: mockExpert.nickname,
    specialty: mockExpert.profession,
    location: mockExpert.location,
    description: mockExpert.description,
    career: mockExpert.career,
    image_url: mockExpert.photoUrl,
    plan_type: mockExpert.planType,
    rating: mockExpert.rating,
    review_count: mockExpert.reviewCount,
    certifications: mockExpert.certifications,
    specialty_tags: mockExpert.specialtyTags,
    consultation_methods: mockExpert.consultationMethods,
    sns_url: mockExpert.snsUrl,
    portfolio_url: mockExpert.portfolioUrl,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const numericId = Number(id);

  if (!Number.isFinite(numericId)) {
    notFound();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let expert: Expert | null = null;
  let reviews: ExpertReview[] = [];

  const canQuerySupabase = Boolean(supabaseUrl && supabaseAnonKey);

  if (canQuerySupabase && supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from("experts")
      .select("id, name, specialty, location, description, career, image_url, plan_type, approval_status")
      .eq("id", numericId)
      .eq("approved", true)
      .eq("approval_status", "approved")
      .maybeSingle<Expert>();

    if (error) {
      console.warn("EXPERT QUERY ERROR:", error.message);
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("experts")
        .select("id, name, specialty, location, description, career, image_url")
        .eq("id", numericId)
        .eq("approved", true)
        .eq("approval_status", "approved")
        .maybeSingle<Omit<Expert, "plan_type">>();

      if (fallbackError) {
        console.warn("EXPERT FALLBACK QUERY ERROR:", fallbackError.message);
      }

      expert = fallbackData ? { ...fallbackData, plan_type: "free" } : null;
    } else {
      expert = data;
    }

    const { data: reviewRows, error: reviewError } = await supabase
      .from("reviews")
      .select("id, expert_id, user_id, request_id, rating, content, created_at")
      .eq("expert_id", numericId)
      .order("created_at", { ascending: false })
      .returns<ExpertReview[]>();

    if (reviewError) {
      console.warn("REVIEWS QUERY ERROR:", reviewError.message);
    } else {
      reviews = reviewRows || [];
    }
  }

  if (!expert && !canQuerySupabase) {
    expert = await getMockExpert(numericId);
  }

  if (!expert) {
    notFound();
  }

  const category = deriveCategory(expert.specialty);
  const specialtyAreas = getExpertSpecialtyAreas(expert, category);
  const experienceItems = getExperienceItems(expert, category);
  const certificationItems = getExpertCertificationItems(expert, category);
  const oneLineIntro = getOneLineIntro(category, expert.specialty);
  const consultationCount = getConsultationCount(
    expert.review_count ?? reviews.length,
    expert.id
  );
  const distanceLabel = getDistanceLabel(expert.id);
  const timelineItems = getTimelineItems(experienceItems);
  const reviewAverage =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;
  const expertRating =
    reviews.length > 0 ? reviewAverage : expert.rating ?? (canQuerySupabase ? 0 : rating);
  const expertReviewCount =
    reviews.length > 0
      ? reviews.length
      : expert.review_count ?? (canQuerySupabase ? 0 : reviewCount);
  const completeness = getProfileCompleteness({
    image_url: expert.image_url,
    description: expert.description,
    career: expert.career,
    certifications: expert.certifications,
    location: expert.location,
    consultation_methods: expert.consultation_methods,
    sns_url: expert.sns_url,
    portfolio_url: expert.portfolio_url,
  });
  const verificationScore = 93;
  const responseRate = "98%";
  const averageResponseTime = "1시간 이내";
  const reviewTags = ["#전문성", "#친절함", "#빠른응답", "#결과만족"];
  const recommendationReasons = [
    "관련 사례 다수",
    "높은 고객 만족도",
    "빠른 응답률",
    "검증 절차 통과",
  ];
  const philosophy =
    "좋은 전문가는 단순히 문제를 해결하는 사람이 아니라, 고객이 스스로 이해하고 선택할 수 있게 돕는 사람이라고 생각합니다.";

  return (
    <main className="min-h-screen bg-[#F5F1E8] pb-28 text-[#111111]">
      <ExpertViewAnalytics
        expertId={expert.id}
        expertName={expert.name}
        category={category}
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <Link
          href="/experts"
          className="inline-flex rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-extrabold text-[#0F5132] shadow-sm transition hover:border-[#111111]"
        >
          전문가 목록으로
        </Link>

        <section className="mt-5 overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white shadow-[0_28px_90px_rgba(24,24,20,0.12)]">
          <div className="grid lg:grid-cols-[440px_minmax(0,1fr)]">
            <div className="relative min-h-[360px] bg-[#E5E7EB] sm:min-h-[500px]">
              <Image
                src={expert.image_url || fallbackImage}
                alt={expert.name}
                fill
                unoptimized
                sizes="(max-width: 1024px) 100vw, 420px"
                className="object-cover"
                priority
              />
            </div>

            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#0F5132] px-4 py-2 text-xs font-black text-white">
                  TRUPICK VERIFIED
                </span>
                <span className="rounded-full bg-[#FFF1EC] px-4 py-2 text-xs font-black text-[#D65339]">
                  {category}
                </span>
                {expert.plan_type === "premium" ? (
                  <span className="rounded-full bg-[#111111] px-4 py-2 text-xs font-black text-white">
                    ✓ PREMIUM
                  </span>
                ) : null}
                <span className="rounded-full bg-[#F4F7F1] px-4 py-2 text-xs font-black text-[#0F5132]">
                  검증 점수 {verificationScore}점
                </span>
              </div>

              <h1 className="mt-7 text-[clamp(2.5rem,11vw,5rem)] font-black leading-[0.98] tracking-normal text-[#111111] sm:tracking-[-0.04em]">
                {expert.name}
              </h1>
              <p className="mt-4 text-xl font-black leading-8 text-[#111111]">
                {expert.specialty || "운동재활 전문가"}
              </p>
              <p className="mt-2 text-base font-bold leading-7 text-[#4B5563] sm:text-lg">
                {oneLineIntro}
              </p>
              <p className="mt-4 text-base font-extrabold text-[#111111]">
                {expert.location}
              </p>

              {expert.plan_type === "premium" ? (
                <div className="mt-5 rounded-[8px] border border-[#111111] bg-[#111111] p-4 text-white">
                  <p className="text-xs font-black uppercase tracking-[0.16em]">
                    Premium Expert
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6">
                    우선 노출 전문가입니다. TRUPICK 추천 영역과 탐색 결과에서 더 잘 보이도록 설정되어 있습니다.
                  </p>
                </div>
              ) : null}

              <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-[8px] bg-[#FBFAF7] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6B7280]">
                    Rating
                  </p>
                  <p className="mt-2 text-xl font-black text-[#111111]">
                    ⭐ {expertRating.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-[8px] bg-[#FBFAF7] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6B7280]">
                    Reviews
                  </p>
                  <p className="mt-2 text-xl font-black text-[#111111]">
                    리뷰 {expertReviewCount}개
                  </p>
                </div>
                <div className="rounded-[8px] bg-[#FBFAF7] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6B7280]">
                    Consultations
                  </p>
                  <p className="mt-2 text-xl font-black text-[#111111]">
                    상담 {consultationCount}건
                  </p>
                </div>
                <div className="rounded-[8px] bg-[#FBFAF7] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6B7280]">
                    Distance
                  </p>
                  <p className="mt-2 text-xl font-black text-[#111111]">
                    {distanceLabel}
                  </p>
                </div>
                <div className="rounded-[8px] bg-[#FBFAF7] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6B7280]">
                    Response Rate
                  </p>
                  <p className="mt-2 text-xl font-black text-[#111111]">
                    {responseRate}
                  </p>
                </div>
                <div className="rounded-[8px] bg-[#FBFAF7] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6B7280]">
                    Response Time
                  </p>
                  <p className="mt-2 text-xl font-black text-[#111111]">
                    {averageResponseTime}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="grid gap-6">
            <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
                TRUPICK Verification
              </p>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-3xl font-black text-[#111111]">
                    왜 검증된 전문가인가요?
                  </h2>
                  <p className="mt-3 max-w-2xl text-base font-bold leading-8 text-[#374151]">
                    TRUPICK은 신원, 경력, 자격, 인터뷰, 실제 사례를 함께 확인해 고객이 더 안심하고 전문가를 선택할 수 있도록 검증합니다.
                  </p>
                </div>
                <div className="rounded-[8px] bg-[#0F5132] px-5 py-4 text-white">
                  <p className="text-xs font-black uppercase tracking-[0.16em]">
                    Verification Score
                  </p>
                  <p className="mt-2 text-4xl font-black">{verificationScore}점</p>
                </div>
              </div>
              <div className="mt-7 grid gap-3 md:grid-cols-2">
                {verificationItems.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-5"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0F5132] text-base font-black text-white">
                      ✓
                    </span>
                    <h3 className="mt-4 text-lg font-black text-[#111111]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm font-bold leading-7 text-[#374151]">
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
                Specialty
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#111111]">
                전문 분야
              </h2>
              <div className="mt-6 flex flex-wrap gap-2">
                {specialtyAreas.map((area) => (
                  <span
                    key={area}
                    className="rounded-full border border-[#D9CFBF] bg-[#FBFAF7] px-4 py-3 text-sm font-black text-[#111111]"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
                Expert Philosophy
              </p>
              <blockquote className="mt-4 rounded-[8px] bg-[#FBFAF7] p-6 text-xl font-black leading-9 text-[#111111] sm:text-2xl sm:leading-10">
                “{philosophy}”
              </blockquote>
              <p className="mt-5 text-base font-bold leading-8 text-[#374151]">
                {expert.description}
              </p>
            </section>

            <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
                TRUPICK Interview
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#111111]">
                인터뷰로 확인한 상담 방식
              </h2>
              <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="relative min-h-[260px] overflow-hidden rounded-[8px] bg-[#111111]">
                  <Image
                    src={expert.image_url || fallbackImage}
                    alt={`${expert.name} 인터뷰 썸네일`}
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 640px"
                    className="object-cover opacity-70"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl font-black text-[#111111]">
                      ▶
                    </span>
                    <h3 className="mt-5 text-2xl font-black">3분 인터뷰 보기</h3>
                    <p className="mt-2 text-sm font-bold leading-6 text-white">
                      전문가의 철학과 실제 상담 방식을 짧은 인터뷰로 확인합니다.
                    </p>
                  </div>
                </div>
                <div className="rounded-[8px] bg-[#FBFAF7] p-5">
                  <p className="text-sm font-black text-[#111111]">
                    질문 미리보기
                  </p>
                  <ul className="mt-4 grid gap-3 text-sm font-bold leading-7 text-[#374151]">
                    <li>어떤 고객을 가장 많이 도와왔나요?</li>
                    <li>가장 자신 있는 전문 분야는 무엇인가요?</li>
                    <li>고객이 자주 하는 실수는 무엇인가요?</li>
                  </ul>
                  <PreparedAlertButton
                    message="인터뷰 영상은 준비 중입니다."
                    className="mt-5 w-full rounded-full bg-[#111111] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0F5132]"
                  >
                    인터뷰 보기
                  </PreparedAlertButton>
                </div>
              </div>
            </section>

            <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
                Verified Cases
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#111111]">
                검증된 사례
              </h2>
              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {caseStudies.map((caseStudy) => (
                  <article
                    key={caseStudy.title}
                    className="flex min-h-full flex-col rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-5"
                  >
                    <h3 className="text-xl font-black text-[#111111]">
                      {caseStudy.title}
                    </h3>
                    <p className="mt-2 text-sm font-black text-[#0F5132]">
                      {caseStudy.customer} · {caseStudy.period}
                    </p>
                    <div className="mt-5 grid gap-3 text-sm font-bold leading-7 text-[#374151]">
                      <p>
                        <span className="font-black text-[#111111]">문제</span>{" "}
                        {caseStudy.problem}
                      </p>
                      <p>
                        <span className="font-black text-[#111111]">과정</span>{" "}
                        {caseStudy.process}
                      </p>
                      <p>
                        <span className="font-black text-[#111111]">결과</span>{" "}
                        {caseStudy.result}
                      </p>
                    </div>
                    <PreparedAlertButton
                      message="사례 상세 리포트는 준비 중입니다."
                      className="mt-6 w-full rounded-full border border-[#111111] bg-white px-5 py-3 text-sm font-black text-[#111111] transition hover:bg-[#111111] hover:text-white"
                    >
                      자세히 보기
                    </PreparedAlertButton>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
                Certification
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#111111]">자격증</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {certificationItems.map((item) => (
                  <article
                    key={item}
                    className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-5"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111111] text-sm font-black text-white">
                      ✓
                    </span>
                    <h3 className="mt-4 text-base font-extrabold text-[#111111]">
                      {item}
                    </h3>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
                Experience
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#111111]">경력</h2>
              <ol className="mt-6 grid gap-4">
                {timelineItems.map((item) => (
                  <li key={`${item.year}-${item.title}`} className="relative pl-10">
                    <span className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#0F5132] text-[10px] font-black text-white">
                      ●
                    </span>
                    <div className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-5">
                      <p className="text-sm font-black text-[#0F5132]">
                        {item.year}
                      </p>
                      <p className="mt-2 text-lg font-black text-[#111111]">
                        {item.title}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
                Expert Q&A
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#111111]">
                전문가에게 자주 묻는 질문
              </h2>
              <ExpertQnaAccordion items={qnaItems} />
            </section>

            <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
                Review Tags
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#111111]">
                후기 키워드
              </h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {reviewTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#E8F2EC] px-4 py-2 text-sm font-black text-[#0F5132]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            <ExpertReviewsSection
              expertId={expert.id}
              expertName={expert.name}
              initialReviews={reviews}
            />

            <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
                Why TRUPICK Recommends This Expert
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#111111]">
                TRUPICK 추천 이유
              </h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {recommendationReasons.map((reason) => (
                  <article
                    key={reason}
                    className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-5"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111111] text-sm font-black text-white">
                      ✓
                    </span>
                    <h3 className="mt-4 text-lg font-black text-[#111111]">
                      {reason}
                    </h3>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="hidden lg:sticky lg:top-6 lg:block">
            <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-[0_20px_65px_rgba(24,24,20,0.10)]">
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 overflow-hidden rounded-full bg-[#E5E7EB]">
                  <Image
                    src={expert.image_url || fallbackImage}
                    alt={expert.name}
                    fill
                    unoptimized
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-[#111111]">
                    {expert.name}
                  </p>
                  <p className="truncate text-sm font-bold text-[#4B5563]">
                    {category}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[8px] bg-[#FBFAF7] p-4">
                <p className="text-sm font-black text-[#0F5132]">
                  <Stars value={expertRating} />
                </p>
                <p className="mt-2 text-2xl font-black text-[#111111]">
                  {expertRating.toFixed(2)}
                </p>
                <p className="mt-1 text-sm font-bold text-[#4B5563]">
                  상담 {consultationCount}건 · {distanceLabel}
                </p>
              </div>

              <div className="mt-4 rounded-[8px] bg-[#0F5132] p-4 text-white">
                <p className="text-xs font-black uppercase tracking-[0.14em]">
                  TRUPICK VERIFIED
                </p>
                <p className="mt-2 text-3xl font-black">{verificationScore}점</p>
                <p className="mt-2 text-sm font-bold leading-6">
                  응답률 {responseRate} · 평균 {averageResponseTime}
                </p>
              </div>

              <div className="mt-4 rounded-[8px] bg-[#FBFAF7] p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8a8073]">
                      Profile Completeness
                    </p>
                    <p className="mt-2 text-3xl font-black text-[#111111]">
                      {completeness.score}%
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full border-4 border-[#0F5132] bg-white text-center text-xs font-black leading-[2.55rem] text-[#0F5132]">
                    {completeness.completedCount}/{completeness.totalCount}
                  </div>
                </div>
                {completeness.score < 100 ? (
                  <p className="mt-3 text-sm font-bold leading-6 text-[#4B5563]">
                    {completeness.suggestions[0]}
                  </p>
                ) : (
                  <p className="mt-3 text-sm font-bold leading-6 text-[#0F5132]">
                    프로필 정보가 충실하게 완성되었습니다.
                  </p>
                )}
              </div>

              <div className="mt-5 grid gap-3">
                <ConsultationRequestFlow
                  expertId={expert.id}
                  expertName={expert.name}
                  triggerClassName="block w-full rounded-full bg-[#0F5132] px-5 py-4 text-center text-sm font-black text-white transition hover:bg-[#146C43]"
                />
                <FavoriteButton expertId={expert.id} />
                <PreparedAlertButton
                  message="인터뷰 영상은 준비 중입니다."
                  className="w-full rounded-full border border-[#111111] bg-white px-5 py-4 text-center text-sm font-black text-[#111111] transition hover:bg-[#111111] hover:text-white"
                >
                  인터뷰 보기
                </PreparedAlertButton>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E7EB] bg-white/95 px-4 py-3 shadow-[0_-18px_55px_rgba(24,24,20,0.12)] backdrop-blur lg:hidden">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
          <div className="hidden min-w-0 flex-1 sm:block">
            <p className="truncate text-sm font-black text-[#111111]">
              {expert.name} · {expert.specialty}
            </p>
            <p className="mt-1 text-xs font-bold text-[#4B5563]">
              ⭐ {expertRating.toFixed(2)} · 상담 {consultationCount}건 ·{" "}
              {distanceLabel}
            </p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="min-w-0 flex-1 sm:min-w-[260px]">
              <ConsultationRequestFlow
                expertId={expert.id}
                expertName={expert.name}
                triggerClassName="block w-full rounded-full bg-[#0F5132] px-6 py-4 text-center text-sm font-black text-white transition hover:bg-[#146C43]"
              />
            </div>
            <FavoriteButton expertId={expert.id} size="compact" />
            <PreparedAlertButton
              message="인터뷰 영상은 준비 중입니다."
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D9CFBF] bg-white text-sm font-black text-[#111111] transition hover:border-[#111111]"
            >
              ▶
            </PreparedAlertButton>
          </div>
        </div>
      </div>
    </main>
  );
}
