import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ConsultationRequestFlow from "@/app/components/ConsultationRequestFlow";
import ExpertViewAnalytics from "@/app/components/ExpertViewAnalytics";
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
  rating?: number;
  review_count?: number;
  certifications?: string[];
  consultation_methods?: string[];
  sns_url?: string | null;
  portfolio_url?: string | null;
};

const rating = 4.98;
const reviewCount = 127;

const fallbackImage =
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80";

const recentReviews = [
  {
    author: "김서연",
    date: "2026.05.18",
    text: "상담이 매우 만족스러웠습니다. 현재 상태를 정확하게 짚어주고 실행 계획까지 명확하게 안내해주셨어요.",
  },
  {
    author: "박준호",
    date: "2026.05.09",
    text: "처음부터 신뢰가 갔습니다. 설명이 쉽고, 제 상황에 맞는 방향을 차분하게 제안해주셨습니다.",
  },
];

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
    return ["어깨 재활", "허리 통증 관리", "체형 교정", "근력 향상"];
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

function getExperienceItems(expert: Expert, category: string) {
  if (category === "운동/재활") {
    return ["OO센터 수석 트레이너", "스포츠의학 대학원", "경력 8년"];
  }

  return [
    `${expert.specialty} 전문 컨설턴트`,
    "TRUPICK 검증 전문가",
    expert.career || "고객 맞춤 상담 경력 8년",
  ];
}

function getCertificationItems(category: string) {
  if (category === "운동/재활") {
    return ["생활스포츠지도사", "건강운동관리사", "NSCA-CPT"];
  }

  return ["TRUPICK Verified Expert", "Professional Consultation", "Quality Review"];
}

function Stars({ value = rating }: { value?: number }) {
  return <span aria-label={`${value}점`}>★★★★★</span>;
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
  console.log("PARAM ID:", id);

  const numericId = Number(id);

  if (!Number.isFinite(numericId)) {
    console.log("EXPERT:", null);
    notFound();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let expert: Expert | null = null;

  const canQuerySupabase = Boolean(supabaseUrl && supabaseAnonKey);

  if (canQuerySupabase && supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from("experts")
      .select("id, name, specialty, location, description, career, image_url, plan_type")
      .eq("id", numericId)
      .eq("approved", true)
      .maybeSingle<Expert>();

    if (error) {
      console.warn("EXPERT QUERY ERROR:", error.message);
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("experts")
        .select("id, name, specialty, location, description, career, image_url")
        .eq("id", numericId)
        .eq("approved", true)
        .maybeSingle<Omit<Expert, "plan_type">>();

      if (fallbackError) {
        console.warn("EXPERT FALLBACK QUERY ERROR:", fallbackError.message);
      }

      expert = fallbackData ? { ...fallbackData, plan_type: "free" } : null;
    } else {
      expert = data;
    }
  }

  if (!expert && !canQuerySupabase) {
    expert = await getMockExpert(numericId);
  }

  console.log("EXPERT:", expert);

  if (!expert) {
    notFound();
  }

  const category = deriveCategory(expert.specialty);
  const specialtyAreas = getSpecialtyAreas(category);
  const experienceItems = getExperienceItems(expert, category);
  const certificationItems = getCertificationItems(category);
  const expertRating = expert.rating ?? rating;
  const expertReviewCount = expert.review_count ?? reviewCount;
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
    <main className="min-h-screen bg-[#F5F1E8] text-[#111111]">
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
          <div className="grid lg:grid-cols-[440px_minmax(0,1fr)]">
            <div className="relative min-h-[440px] bg-[#E5E7EB]">
              <Image
                src={expert.image_url || fallbackImage}
                alt={expert.name}
                fill
                unoptimized
                sizes="(max-width: 1024px) 100vw, 440px"
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

              <h1 className="mt-6 text-[clamp(2.6rem,7vw,5rem)] font-black leading-[0.96] tracking-[-0.04em] text-[#111111]">
                {expert.name}
              </h1>
              <p className="mt-4 text-xl font-bold leading-8 text-[#4B5563]">
                {expert.specialty || "Sports Rehabilitation Specialist"}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-base font-black">
                <span className="text-[#0F5132]">
                  <Stars value={expertRating} />
                </span>
                <span>{expertRating.toFixed(2)}</span>
                <span className="text-[#4B5563]">
                  ({expertReviewCount} reviews)
                </span>
              </div>

              <p className="mt-4 text-lg font-extrabold text-[#111111]">
                {expert.location}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="grid gap-6">
            <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
                About
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#111111]">
                전문가 소개
              </h2>
              <p className="mt-5 text-base font-bold leading-8 text-[#4B5563]">
                {expert.description}
              </p>
            </section>

            <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
                Specialty
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#111111]">
                전문 분야
              </h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {specialtyAreas.map((area) => (
                  <div
                    key={area}
                    className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-4 text-base font-extrabold text-[#111111]"
                  >
                    {area}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
                Experience
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#111111]">경력</h2>
              <ul className="mt-6 grid gap-3">
                {experienceItems.map((item) => (
                  <li
                    key={item}
                    className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-4 text-base font-bold leading-7 text-[#111111]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
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
                Recent Reviews
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#111111]">리뷰</h2>
              <div className="mt-6 grid gap-4">
                {recentReviews.map((review) => (
                  <article
                    key={`${review.author}-${review.date}`}
                    className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-5"
                  >
                    <p className="font-black text-[#0F5132]">
                      <Stars value={expertRating} />
                    </p>
                    <p className="mt-4 text-base font-bold leading-8 text-[#111111]">
                      {review.text}
                    </p>
                    <p className="mt-4 text-sm font-bold text-[#4B5563]">
                      {review.author} · {review.date}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-6">
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
                  {expertReviewCount} reviews · {expert.location}
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
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
