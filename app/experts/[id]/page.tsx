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

  return (
    <main className="min-h-screen bg-[#F5F1E8] pb-28 text-[#111111]">
      <ExpertViewAnalytics
        expertId={expert.id}
        expertName={expert.name}
        category={category}
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <Link
          href="/experts"
          className="inline-flex rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-extrabold text-[#0F5132] shadow-sm transition hover:border-[#111111]"
        >
          전문가 목록으로
        </Link>

        <section className="mt-5 overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white shadow-[0_24px_80px_rgba(24,24,20,0.10)]">
          <div className="grid lg:grid-cols-[420px_minmax(0,1fr)]">
            <div className="relative min-h-[340px] bg-[#E5E7EB] sm:min-h-[420px]">
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
                <span className="rounded-full bg-[#E8F2EC] px-4 py-2 text-xs font-black text-[#0F5132]">
                  VERIFIED
                </span>
                <span className="rounded-full bg-[#FFF1EC] px-4 py-2 text-xs font-black text-[#D65339]">
                  {category}
                </span>
                {expert.plan_type === "premium" ? (
                  <span className="rounded-full bg-[#111111] px-4 py-2 text-xs font-black text-white">
                    ✓ PREMIUM
                  </span>
                ) : null}
                {completeness.score >= 90 ? (
                  <span className="rounded-full bg-[#E8F2EC] px-4 py-2 text-xs font-black text-[#0F5132]">
                    COMPLETE PROFILE
                  </span>
                ) : null}
              </div>

              <h1 className="mt-6 text-[clamp(2.4rem,12vw,4.8rem)] font-black leading-[0.98] tracking-normal text-[#111111] sm:tracking-[-0.04em]">
                {expert.name}
              </h1>
              <p className="mt-4 text-xl font-black leading-8 text-[#111111]">
                {expert.specialty || "운동재활 전문가"}
              </p>
              <p className="mt-2 text-base font-bold leading-7 text-[#4B5563] sm:text-lg">
                {oneLineIntro}
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

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
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
              </div>

              <p className="mt-5 text-base font-extrabold text-[#111111]">
                {expert.location}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="grid gap-6">
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
                About
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#111111]">
                상세 소개
              </h2>
              <p className="mt-5 text-base font-bold leading-8 text-[#374151]">
                {expert.description}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[8px] bg-[#FBFAF7] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#6B7280]">
                    Category
                  </p>
                  <p className="mt-2 text-sm font-black text-[#111111]">
                    {category}
                  </p>
                </div>
                <div className="rounded-[8px] bg-[#FBFAF7] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#6B7280]">
                    Reviews
                  </p>
                  <p className="mt-2 text-sm font-black text-[#111111]">
                    {expertReviewCount}개 후기
                  </p>
                </div>
                <div className="rounded-[8px] bg-[#FBFAF7] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#6B7280]">
                    Location
                  </p>
                  <p className="mt-2 text-sm font-black text-[#111111]">
                    {expert.location}
                  </p>
                </div>
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

            <ExpertReviewsSection
              expertId={expert.id}
              expertName={expert.name}
              initialReviews={reviews}
            />
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

              <div className="mt-5">
                <ConsultationRequestFlow
                  expertId={expert.id}
                  expertName={expert.name}
                  triggerClassName="block w-full rounded-full bg-[#0F5132] px-5 py-4 text-center text-sm font-black text-white transition hover:bg-[#146C43]"
                />
              </div>

              <div className="mt-3">
                <FavoriteButton expertId={expert.id} />
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E7EB] bg-white/95 px-4 py-3 shadow-[0_-18px_55px_rgba(24,24,20,0.12)] backdrop-blur">
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
          <div className="w-full sm:w-auto sm:min-w-[260px]">
            <ConsultationRequestFlow
              expertId={expert.id}
              expertName={expert.name}
              triggerClassName="block w-full rounded-full bg-[#0F5132] px-6 py-4 text-center text-sm font-black text-white transition hover:bg-[#146C43]"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
