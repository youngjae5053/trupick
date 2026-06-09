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
import { PreparedAlertButton } from "@/app/components/VerifiedExpertProfileActions";

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
  rating?: number | null;
  review_count?: number | null;
  certifications?: string[] | null;
  specialty_tags?: string[] | null;
  consultation_methods?: string[] | null;
  sns_url?: string | null;
  portfolio_url?: string | null;
};

const defaultRating = 0;
const defaultReviewCount = 0;

const verificationReasons = [
  {
    title: "전문성",
    description:
      "경력과 세부 분야가 명확하며, 고객 상태에 맞춘 상담 프로세스를 보유하고 있습니다.",
  },
  {
    title: "검증",
    description:
      "프로필, 자격 정보, 상담 철학, 인터뷰 기준을 바탕으로 TRUPICK 팀이 검토했습니다.",
  },
  {
    title: "결과",
    description:
      "실제 사례와 후기에서 문제 진단, 진행 과정, 결과 개선 흐름이 확인됩니다.",
  },
];

function deriveCategory(specialty: string) {
  if (/운동|재활|트레이너|체형|통증|필라테스|러닝|근력/.test(specialty)) {
    return "운동/재활";
  }

  if (/세무|세금|절세|소득세|부가세/.test(specialty)) {
    return "세무";
  }

  if (/법률|계약|변호|분쟁|소송/.test(specialty)) {
    return "법률";
  }

  if (/사진|영상|촬영|편집/.test(specialty)) {
    return "사진/영상";
  }

  if (/디자인|브랜드|UI|로고/.test(specialty)) {
    return "디자인";
  }

  if (/마케팅|광고|퍼널|캠페인/.test(specialty)) {
    return "마케팅";
  }

  if (/심리|상담|마음|관계/.test(specialty)) {
    return "심리상담";
  }

  return "검증 전문가";
}

function getSpecialtyTags(expert: Expert, category: string) {
  if (expert.specialty_tags && expert.specialty_tags.length > 0) {
    return expert.specialty_tags;
  }

  if (category === "운동/재활") {
    return ["재활운동", "통증관리", "체형교정", "운동처방", "기능회복"];
  }

  return ["문제 진단", "맞춤 상담", "실행 계획", "후속 관리"];
}

function getCertifications(expert: Expert) {
  if (expert.certifications && expert.certifications.length > 0) {
    return expert.certifications;
  }

  return [];
}

function getConsultationMethods(expert: Expert) {
  if (expert.consultation_methods && expert.consultation_methods.length > 0) {
    return expert.consultation_methods;
  }

  return ["상담 방식 협의"];
}

function getConsultationCount(reviewCount: number) {
  return reviewCount;
}

function getDistanceLabel() {
  return "지역 협의";
}

function getResponseTime() {
  return "확인 후 안내";
}

function getPhilosophy(expert: Expert) {
  return getSectionValue(expert.description, "전문가 철학") || expert.description;
}

function getBestFitCustomers(category: string) {
  if (category === "운동/재활") {
    return "통증 때문에 운동을 망설이는 분, 체형교정이 필요한 분, 안전하게 근력을 키우고 싶은 분에게 잘 맞습니다.";
  }

  return "문제를 차분하게 정리하고 실행 가능한 다음 단계를 알고 싶은 고객에게 잘 맞습니다.";
}

function Stars({ value }: { value: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(value)));

  return (
    <span aria-label={`${value}점`} className="tracking-[0.08em] text-[#1E4D3D]">
      {"★".repeat(filled)}
      <span className="text-[#CBD5E1]">{"★".repeat(5 - filled)}</span>
    </span>
  );
}

const structuredDescriptionLabels = [
  "연락처",
  "상담 방식",
  "한 줄 소개",
  "전문가 철학",
  "수업/상담 방식",
  "고객에게 약속하는 것",
  "대표 사례",
];

function getSectionValue(source: string | null | undefined, label: string) {
  if (!source) {
    return "";
  }

  const lines = source.split("\n");
  const labelIndex = lines.findIndex((line) => line.trim() === label);

  if (labelIndex < 0) {
    return "";
  }

  const values: string[] = [];

  for (const line of lines.slice(labelIndex + 1)) {
    const trimmed = line.trim();

    if (
      structuredDescriptionLabels.includes(trimmed) ||
      (trimmed.length === 0 && values.length > 0)
    ) {
      break;
    }

    if (trimmed.length > 0) {
      values.push(trimmed);
    }
  }

  return values.join("\n").trim();
}

export default async function ExpertDetailPage({
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
  const canQuerySupabase = Boolean(supabaseUrl && supabaseAnonKey);
  let expert: Expert | null = null;
  let reviews: ExpertReview[] = [];
  let similarExperts: Array<{
    id: number;
    name: string;
    specialty: string;
    location: string;
    image_url: string | null;
    plan_type: "free" | "premium" | null;
  }> = [];

  if (canQuerySupabase && supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from("experts")
      .select(
        "id, name, specialty, location, description, career, image_url, plan_type, approval_status, rating, review_count"
      )
      .eq("id", numericId)
      .eq("approved", true)
      .eq("approval_status", "approved")
      .maybeSingle<Expert>();

    if (error) {
      console.warn("EXPERT QUERY ERROR:", error.message);
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

    if (expert) {
      const { data: similarRows, error: similarError } = await supabase
        .from("experts")
        .select("id, name, specialty, location, image_url, plan_type")
        .neq("id", numericId)
        .eq("approved", true)
        .eq("approval_status", "approved")
        .ilike("specialty", `%${expert.specialty.slice(0, 4)}%`)
        .limit(3)
        .returns<typeof similarExperts>();

      if (similarError) {
        console.warn("SIMILAR EXPERTS QUERY ERROR:", similarError.message);
      } else {
        similarExperts = similarRows || [];
      }
    }
  }

  if (!expert) {
    notFound();
  }

  const category = deriveCategory(expert.specialty);
  const tags = getSpecialtyTags(expert, category);
  const certifications = getCertifications(expert);
  const consultationMethods = getConsultationMethods(expert);
  const reviewAverage =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;
  const displayRating =
    reviews.length > 0 ? reviewAverage : expert.rating ?? defaultRating;
  const displayReviewCount =
    reviews.length > 0 ? reviews.length : expert.review_count ?? defaultReviewCount;
  const consultationCount = getConsultationCount(displayReviewCount);
  const distanceLabel = getDistanceLabel();
  const responseTime = getResponseTime();
  const philosophy = getPhilosophy(expert);
  const bestFitCustomers = getBestFitCustomers(category);
  const reviewsForDisplay = reviews;
  const casePortfolio = getSectionValue(expert.description, "대표 사례");
  const representativeCases = casePortfolio
    ? [
        {
          title: "대표 사례",
          content: casePortfolio,
        },
      ]
    : [];

  return (
    <main className="min-h-screen bg-[#F6F3EC] pb-24 text-[#0F172A]">
      <ExpertViewAnalytics
        expertId={expert.id}
        expertName={expert.name}
        category={category}
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <Link
          href="/experts"
          className="inline-flex rounded-full border border-[#D8D0C2] bg-white px-4 py-2 text-sm font-black text-[#1E4D3D] transition hover:border-[#1E4D3D]"
        >
          전문가 목록으로
        </Link>

        <section className="mt-5 overflow-hidden rounded-[8px] border border-[#E5E0D6] bg-white">
          <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
            <div className="relative min-h-[360px] bg-[#E5E0D6] sm:min-h-[560px]">
              {expert.image_url ? (
                <Image
                  src={expert.image_url}
                  alt={expert.name}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full min-h-[360px] w-full items-center justify-center bg-[#E8F2EC] text-8xl font-black text-[#1E4D3D] sm:min-h-[560px]">
                  {expert.name.slice(0, 1)}
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-12">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#1E4D3D] px-4 py-2 text-xs font-black text-white">
                  TRUPICK VERIFIED
                </span>
                {expert.plan_type === "premium" ? (
                  <span className="rounded-full bg-[#0F172A] px-4 py-2 text-xs font-black text-white">
                    Premium
                  </span>
                ) : null}
                <span className="rounded-full bg-[#F6F3EC] px-4 py-2 text-xs font-black text-[#1E4D3D]">
                  검증 점수 93점
                </span>
              </div>

              <h1 className="mt-8 text-[clamp(2.8rem,9vw,5.6rem)] font-black leading-[0.95] tracking-normal text-[#0F172A] sm:tracking-[-0.04em]">
                {expert.name}
              </h1>
              <p className="mt-5 text-2xl font-black text-[#0F172A]">
                {expert.specialty}
              </p>
              <p className="mt-2 text-base font-bold leading-7 text-[#374151]">
                {expert.location} · {category}
              </p>
              <p className="mt-6 max-w-xl text-xl font-black leading-9 text-[#0F172A]">
                “{philosophy}”
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  ["평점", displayRating.toFixed(2)],
                  ["리뷰", `${displayReviewCount}개`],
                  ["상담", `${consultationCount}건`],
                  ["경력", expert.career || "검증 경력 보유"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[8px] bg-[#F8F6F0] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#64748B]">
                      {label}
                    </p>
                    <p className="mt-2 text-xl font-black text-[#0F172A]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ConsultationRequestFlow
                  expertId={expert.id}
                  expertName={expert.name}
                  triggerLabel="무료 상담 신청"
                  triggerClassName="rounded-full bg-[#1E4D3D] px-7 py-4 text-center text-sm font-black text-white transition hover:bg-[#173D31]"
                />
                <FavoriteButton expertId={expert.id} />
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="grid gap-8">
            <section className="rounded-[8px] border border-[#E5E0D6] bg-white p-6 sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#1E4D3D]">
                Why TRUPICK Chose This Expert
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#0F172A] sm:text-4xl">
                TRUPICK이 이 전문가를 선택한 이유
              </h2>
              <div className="mt-7 grid gap-4 md:grid-cols-3">
                {verificationReasons.map((reason) => (
                  <article
                    key={reason.title}
                    className="rounded-[8px] border border-[#E5E0D6] bg-[#F8F6F0] p-5"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1E4D3D] text-sm font-black text-white">
                      ✓
                    </span>
                    <h3 className="mt-5 text-xl font-black text-[#0F172A]">
                      {reason.title}
                    </h3>
                    <p className="mt-3 text-sm font-bold leading-7 text-[#374151]">
                      {reason.description}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[8px] border border-[#E5E0D6] bg-white p-6 sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#1E4D3D]">
                Expert Story
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#0F172A] sm:text-4xl">
                전문가 소개
              </h2>
              <div className="mt-6 grid gap-4">
                <div className="rounded-[8px] bg-[#F8F6F0] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1E4D3D]">
                    Philosophy
                  </p>
                  <p className="mt-3 text-lg font-black leading-8 text-[#0F172A]">
                    {philosophy}
                  </p>
                </div>
                <p className="text-base font-bold leading-8 text-[#374151]">
                  {expert.description}
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <article className="rounded-[8px] border border-[#E5E0D6] p-5">
                    <h3 className="text-lg font-black text-[#0F172A]">
                      수업/상담 방식
                    </h3>
                    <p className="mt-3 text-sm font-bold leading-7 text-[#374151]">
                      상태 평가 후 원인, 목표, 생활 패턴을 함께 정리하고 고객이 이해할 수 있는 운동 계획으로 연결합니다.
                    </p>
                  </article>
                  <article className="rounded-[8px] border border-[#E5E0D6] p-5">
                    <h3 className="text-lg font-black text-[#0F172A]">
                      잘 맞는 고객
                    </h3>
                    <p className="mt-3 text-sm font-bold leading-7 text-[#374151]">
                      {bestFitCustomers}
                    </p>
                  </article>
                </div>
              </div>
            </section>

            <section className="rounded-[8px] border border-[#E5E0D6] bg-white p-6 sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#1E4D3D]">
                Representative Cases
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#0F172A] sm:text-4xl">
                대표 사례
              </h2>
              <div className="mt-7 grid gap-4 lg:grid-cols-3">
                {representativeCases.map((item) => (
                  <article
                    key={item.title}
                    className="flex min-h-full flex-col rounded-[8px] border border-[#E5E0D6] bg-[#F8F6F0] p-5"
                  >
                    <h3 className="mt-2 text-2xl font-black text-[#0F172A]">
                      {item.title}
                    </h3>
                    <p className="mt-5 whitespace-pre-wrap text-sm font-bold leading-7 text-[#374151]">
                      {item.content}
                    </p>
                  </article>
                ))}
                {representativeCases.length === 0 ? (
                  <div className="rounded-[8px] border border-[#E5E0D6] bg-[#F8F6F0] p-6 lg:col-span-3">
                    <p className="text-xl font-black text-[#0F172A]">
                      대표 사례는 현재 검토 중입니다.
                    </p>
                    <p className="mt-3 text-sm font-bold leading-7 text-[#374151]">
                      TRUPICK 팀이 전문가의 사례 정보를 확인한 뒤 공개합니다.
                    </p>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-[8px] border border-[#E5E0D6] bg-white p-6 sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#1E4D3D]">
                Session Information
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#0F172A] sm:text-4xl">
                수업 안내
              </h2>
              <div className="mt-7 grid gap-4 md:grid-cols-2">
                {[
                  ["상담 방식", consultationMethods.join(" / ")],
                  ["가능 지역", expert.location],
                  ["추천 대상", bestFitCustomers],
                  ["예상 응답 시간", responseTime],
                ].map(([label, value]) => (
                  <article
                    key={label}
                    className="rounded-[8px] border border-[#E5E0D6] bg-[#F8F6F0] p-5"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1E4D3D]">
                      {label}
                    </p>
                    <p className="mt-3 text-base font-black leading-7 text-[#0F172A]">
                      {value}
                    </p>
                  </article>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#D8D0C2] bg-white px-4 py-2 text-sm font-black text-[#0F172A]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {certifications.map((item) => (
                  <article
                    key={item}
                    className="rounded-[8px] border border-[#E5E0D6] p-4"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1E4D3D] text-sm font-black text-white">
                      ✓
                    </span>
                    <p className="mt-3 text-sm font-black leading-6 text-[#0F172A]">
                      {item}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[8px] border border-[#E5E0D6] bg-white p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-[#1E4D3D]">
                    Reviews
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-[#0F172A] sm:text-4xl">
                    회원 후기
                  </h2>
                </div>
                <div className="rounded-[8px] bg-[#F8F6F0] px-4 py-3">
                  <p className="text-sm font-black">
                    <Stars value={displayRating} />
                  </p>
                  <p className="mt-1 text-2xl font-black text-[#0F172A]">
                    {displayRating.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {["#전문성", "#친절함", "#결과만족"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#E8F1EC] px-4 py-2 text-sm font-black text-[#1E4D3D]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            <ExpertReviewsSection
              expertId={expert.id}
              expertName={expert.name}
              initialReviews={reviewsForDisplay}
            />

            <section className="rounded-[8px] border border-[#E5E0D6] bg-white p-6 sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#1E4D3D]">
                Similar Experts
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#0F172A] sm:text-4xl">
                비슷한 전문가
              </h2>
              <div className="mt-7 grid gap-4 md:grid-cols-3">
                {similarExperts.map((similar) => (
                  <Link
                    key={similar.id}
                    href={`/experts/${similar.id}`}
                    className="overflow-hidden rounded-[8px] border border-[#E5E0D6] bg-[#F8F6F0] transition hover:-translate-y-1"
                  >
                    <div className="relative aspect-[4/3] bg-[#E5E0D6]">
                      {similar.image_url ? (
                        <Image
                          src={similar.image_url}
                          alt={similar.name}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#E8F2EC] text-4xl font-black text-[#1E4D3D]">
                          {similar.name.slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {similar.plan_type === "premium" ? (
                          <span className="rounded-full bg-[#0F172A] px-3 py-1 text-xs font-black text-white">
                            Premium
                          </span>
                        ) : null}
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#1E4D3D]">
                          VERIFIED
                        </span>
                      </div>
                      <h3 className="mt-4 text-xl font-black text-[#0F172A]">
                        {similar.name}
                      </h3>
                      <p className="mt-1 text-sm font-bold text-[#374151]">
                        {similar.specialty}
                      </p>
                      <p className="mt-2 text-sm font-black text-[#0F172A]">
                        {similar.location}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-[8px] border border-[#1E4D3D] bg-[#1E4D3D] p-6 text-white sm:p-8 lg:p-10">
              <p className="text-sm font-black uppercase tracking-[0.18em]">
                Final CTA
              </p>
              <h2 className="mt-3 text-3xl font-black sm:text-5xl">
                이 전문가와 상담해보세요.
              </h2>
              <p className="mt-4 max-w-2xl text-base font-bold leading-8 text-white">
                TRUPICK 검증 전문가가 직접 상담을 도와드립니다.
              </p>
              <div className="mt-7 max-w-xs">
                <ConsultationRequestFlow
                  expertId={expert.id}
                  expertName={expert.name}
                  triggerLabel="무료 상담 신청"
                  triggerClassName="block w-full rounded-full bg-white px-7 py-4 text-center text-sm font-black text-[#1E4D3D] transition hover:bg-[#F6F3EC]"
                />
              </div>
            </section>
          </div>

          <aside className="hidden lg:sticky lg:top-6 lg:block">
            <div className="rounded-[8px] border border-[#E5E0D6] bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="relative h-16 w-16 overflow-hidden rounded-full bg-[#E5E0D6]">
                  {expert.image_url ? (
                    <Image
                      src={expert.image_url}
                      alt={expert.name}
                      fill
                      unoptimized
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-[#E8F2EC] text-xl font-black text-[#1E4D3D]">
                      {expert.name.slice(0, 1)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-[#0F172A]">
                    {expert.name}
                  </p>
                  <p className="truncate text-sm font-bold text-[#374151]">
                    {expert.specialty}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-[8px] bg-[#F8F6F0] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#64748B]">
                    Rating
                  </p>
                  <p className="mt-2 text-xl font-black text-[#0F172A]">
                    {displayRating.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-[8px] bg-[#F8F6F0] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#64748B]">
                    Distance
                  </p>
                  <p className="mt-2 text-xl font-black text-[#0F172A]">
                    {distanceLabel}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[8px] bg-[#1E4D3D] p-5 text-white">
                <p className="text-xs font-black uppercase tracking-[0.14em]">
                  TRUPICK VERIFIED
                </p>
                <p className="mt-2 text-4xl font-black">93점</p>
                <p className="mt-2 text-sm font-bold leading-6">
                  상담 {consultationCount}건 · {responseTime}
                </p>
              </div>

              <div className="mt-5 grid gap-3">
                <ConsultationRequestFlow
                  expertId={expert.id}
                  expertName={expert.name}
                  triggerLabel="무료 상담 신청"
                  triggerClassName="block w-full rounded-full bg-[#1E4D3D] px-5 py-4 text-center text-sm font-black text-white transition hover:bg-[#173D31]"
                />
                <FavoriteButton expertId={expert.id} />
                <PreparedAlertButton
                  message="인터뷰 영상은 준비 중입니다."
                  className="w-full rounded-full border border-[#D8D0C2] bg-white px-5 py-4 text-center text-sm font-black text-[#0F172A] transition hover:border-[#0F172A]"
                >
                  인터뷰 보기
                </PreparedAlertButton>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E0D6] bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
          <div className="hidden min-w-0 flex-1 sm:block">
            <p className="truncate text-sm font-black text-[#0F172A]">
              {expert.name} · {expert.specialty}
            </p>
            <p className="mt-1 text-xs font-bold text-[#374151]">
              ⭐ {displayRating.toFixed(2)} · 상담 {consultationCount}건 ·{" "}
              {distanceLabel}
            </p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="min-w-0 flex-1 sm:min-w-[260px]">
              <ConsultationRequestFlow
                expertId={expert.id}
                expertName={expert.name}
                triggerLabel="무료 상담 신청"
                triggerClassName="block w-full rounded-full bg-[#1E4D3D] px-6 py-4 text-center text-sm font-black text-white transition hover:bg-[#173D31]"
              />
            </div>
            <FavoriteButton expertId={expert.id} size="compact" />
          </div>
        </div>
      </div>
    </main>
  );
}
