"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";
import { getFriendlyErrorMessage } from "@/app/errorMessages";

type ApprovalFilter = "all" | "pending" | "approved" | "rejected";
type ApprovalStatus = Exclude<ApprovalFilter, "all">;
type VerificationCheckKey =
  | "identity"
  | "career"
  | "qualification"
  | "interview"
  | "caseReview";
type QualityCheckKey =
  | "photo"
  | "specialty"
  | "description"
  | "careerInfo"
  | "certification"
  | "casePortfolio"
  | "consultationMethod"
  | "contactAvailability";

type Expert = {
  id: number;
  name: string;
  specialty: string;
  location: string;
  description: string;
  career: string | null;
  approved: boolean | null;
  image_url?: string | null;
  plan_type?: "free" | "premium" | null;
  status?: string | null;
  approval_status?: string | null;
  certifications?: string[] | string | null;
  portfolio_url?: string | null;
  sns_url?: string | null;
  consultation_methods?: string[] | null;
  consultation_fee?: string | null;
  phone?: string | null;
  activity_area?: string | null;
  specialties?: string[] | null;
  career_years?: string | null;
  career_summary?: string | null;
  profile_images?: string[] | null;
  main_profile_image?: string | null;
  intro_line?: string | null;
  philosophy?: string | null;
  cases?: Array<{
    id?: string;
    title?: string;
    problem?: string;
    process?: string;
    result?: string;
    duration?: string;
    imageUrl?: string;
    beforeImageUrl?: string;
    afterImageUrl?: string;
  }> | null;
  profile_completion_score?: number | null;
  detailed_location?: string | null;
  center_name?: string | null;
  map_address?: string | null;
  video_url?: string | null;
  extra_intro?: string | null;
  admin_interview_done?: boolean | null;
  admin_interview_memo?: string | null;
  admin_site_visit_done?: boolean | null;
  admin_video_shoot_done?: boolean | null;
  admin_video_url?: string | null;
  admin_featured_image?: string | null;
  admin_verification_comment?: string | null;
  admin_internal_score?: number | null;
  admin_approval_memo?: string | null;
};

const filters: Array<{ label: string; value: ApprovalFilter }> = [
  { label: "전체", value: "all" },
  { label: "승인대기", value: "pending" },
  { label: "승인완료", value: "approved" },
  { label: "거절", value: "rejected" },
];

const verificationChecklist: Array<{
  key: VerificationCheckKey;
  label: string;
}> = [
  { key: "identity", label: "신원 확인" },
  { key: "career", label: "경력 확인" },
  { key: "qualification", label: "자격/증빙 확인" },
  { key: "interview", label: "인터뷰 필요" },
  { key: "caseReview", label: "사례 검토 완료" },
];

const profileQualityChecklist: Array<{
  key: QualityCheckKey;
  label: string;
}> = [
  { key: "photo", label: "프로필 사진" },
  { key: "specialty", label: "전문 분야 명확성" },
  { key: "description", label: "소개글 완성도" },
  { key: "careerInfo", label: "경력 정보" },
  { key: "certification", label: "자격/증빙" },
  { key: "casePortfolio", label: "대표 사례" },
  { key: "consultationMethod", label: "상담 방식" },
  { key: "contactAvailability", label: "연락 가능 여부" },
];

const structuredDescriptionLabels = [
  "연락처",
  "상담 방식",
  "한 줄 소개",
  "전문가 철학",
  "수업/상담 방식",
  "고객에게 약속하는 것",
  "자주 받는 질문",
  "대표 사례",
];

function getExpertStatus(expert: Expert): ApprovalStatus {
  if (
    expert.approval_status === "rejected" ||
    expert.status === "rejected"
  ) {
    return "rejected";
  }

  if (
    expert.approved === true &&
    (expert.approval_status === "approved" || expert.status === "approved")
  ) {
    return "approved";
  }

  return "pending";
}

function isDraftExpert(expert: Expert) {
  return expert.approval_status === "draft" || expert.status === "draft";
}

function getStatusLabel(status: ApprovalStatus) {
  if (status === "approved") {
    return "Approved";
  }

  if (status === "rejected") {
    return "Rejected";
  }

  return "Pending";
}

function getStatusClassName(status: ApprovalStatus) {
  if (status === "approved") {
    return "bg-[#E8F2EC] text-[#0F5132]";
  }

  if (status === "rejected") {
    return "bg-[#FEE2E2] text-[#991B1B]";
  }

  return "bg-[#FFF4E5] text-[#875200]";
}

function getCertifications(certifications: Expert["certifications"]) {
  if (Array.isArray(certifications)) {
    return certifications.filter(Boolean);
  }

  if (typeof certifications === "string") {
    return certifications
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

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

function getLineValue(source: string | null | undefined, label: string) {
  if (!source) {
    return "";
  }

  const match = source.match(new RegExp(`${label}:\\s*([^\\n]+)`));

  return match?.[1]?.trim() ?? "";
}

function getWizardSummary(expert: Expert) {
  const phone = expert.phone || getSectionValue(expert.description, "연락처");
  const consultationMethods =
    expert.consultation_methods?.join(", ") ||
    getSectionValue(expert.description, "상담 방식");
  const oneLineIntro =
    expert.intro_line || getSectionValue(expert.description, "한 줄 소개");
  const philosophy =
    expert.philosophy || getSectionValue(expert.description, "전문가 철학");
  const teachingMethod = getSectionValue(expert.description, "수업/상담 방식");
  const promise = getSectionValue(expert.description, "고객에게 약속하는 것");
  const faq = getSectionValue(expert.description, "자주 받는 질문");
  const casePortfolio =
    expert.cases && expert.cases.length > 0
      ? expert.cases
          .map((item, index) =>
            [
              `${index + 1}. ${item.title || "제목 미입력"}`,
              item.problem ? `문제: ${item.problem}` : "",
              item.process ? `과정: ${item.process}` : "",
              item.result ? `변화: ${item.result}` : "",
              item.duration ? `기간: ${item.duration}` : "",
            ]
              .filter(Boolean)
              .join("\n")
          )
          .join("\n\n")
      : getSectionValue(expert.description, "대표 사례");
  const careerYears = expert.career_years || getLineValue(expert.career, "경력 년수");
  const careerHighlights =
    expert.career_summary || getLineValue(expert.career, "주요 경력");
  const confidentArea = getLineValue(expert.career, "가장 자신 있는 분야");
  const customerType = getLineValue(expert.career, "잘 맞는 고객 유형");

  return {
    phone,
    consultationMethods,
    oneLineIntro,
    philosophy,
    teachingMethod,
    promise,
    faq,
    casePortfolio,
    careerYears,
    careerHighlights,
    confidentArea,
    customerType,
  };
}

function getProfileCompletenessScore(expert: Expert) {
  if (typeof expert.profile_completion_score === "number") {
    return expert.profile_completion_score;
  }

  const summary = getWizardSummary(expert);
  const certifications = getCertifications(expert.certifications);
  const checks = [
    Boolean(expert.name && expert.location && expert.specialty && summary.phone),
    Boolean(
      summary.careerYears &&
        summary.careerHighlights
    ),
    Boolean(certifications.length > 0),
    Boolean(summary.oneLineIntro && summary.philosophy),
    Boolean(summary.casePortfolio),
  ];

  return checks.filter(Boolean).length * 20;
}

function getPrimaryImage(expert: Expert) {
  return (
    expert.main_profile_image ||
    expert.image_url ||
    expert.profile_images?.[0] ||
    ""
  );
}

function renderLink(url: string | null | undefined, label: string) {
  if (!url) {
    return <span className="text-[#374151]">-</span>;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="font-black text-[#0F5132] underline underline-offset-4"
    >
      {label}
    </a>
  );
}

export default function AdminExpertsPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [activeFilter, setActiveFilter] = useState<ApprovalFilter>("pending");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [adminMemo, setAdminMemo] = useState("");
  const [adminInterviewDone, setAdminInterviewDone] = useState(false);
  const [adminInterviewMemo, setAdminInterviewMemo] = useState("");
  const [adminSiteVisitDone, setAdminSiteVisitDone] = useState(false);
  const [adminVideoShootDone, setAdminVideoShootDone] = useState(false);
  const [adminVideoUrl, setAdminVideoUrl] = useState("");
  const [adminFeaturedImage, setAdminFeaturedImage] = useState("");
  const [adminVerificationComment, setAdminVerificationComment] = useState("");
  const [adminInternalScore, setAdminInternalScore] = useState("");
  const [checklistState, setChecklistState] = useState<
    Record<VerificationCheckKey, boolean>
  >({
    identity: false,
    career: false,
    qualification: false,
    interview: false,
    caseReview: false,
  });
  const [qualityChecklistState, setQualityChecklistState] = useState<
    Record<QualityCheckKey, boolean>
  >({
    photo: false,
    specialty: false,
    description: false,
    careerInfo: false,
    certification: false,
    casePortfolio: false,
    consultationMethod: false,
    contactAvailability: false,
  });

  async function refreshExperts() {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    const { data, error } = await supabase
      .from("experts")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      alert(getFriendlyErrorMessage(error.message));
      return;
    }

    setExperts(data || []);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadExperts() {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        return;
      }

      const { data, error } = await supabase
        .from("experts")
        .select("*")
        .order("id", { ascending: false });

      if (!isMounted) {
        return;
      }

      if (error) {
        alert(getFriendlyErrorMessage(error.message));
        return;
      }

      setExperts(data || []);
    }

    void loadExperts();

    return () => {
      isMounted = false;
    };
  }, []);

  const counts = useMemo(
    () => {
      const reviewableExperts = experts.filter((expert) => !isDraftExpert(expert));

      return {
        all: reviewableExperts.length,
        pending: reviewableExperts.filter((expert) => getExpertStatus(expert) === "pending")
        .length,
        approved: reviewableExperts.filter((expert) => getExpertStatus(expert) === "approved")
        .length,
        rejected: reviewableExperts.filter((expert) => getExpertStatus(expert) === "rejected")
        .length,
        hold: reviewableExperts.filter((expert) => getExpertStatus(expert) === "pending")
        .length,
      };
    },
    [experts]
  );

  const visibleExperts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return experts.filter((expert) => {
      if (isDraftExpert(expert)) {
        return false;
      }

      const status = getExpertStatus(expert);
      const matchesFilter = activeFilter === "all" || status === activeFilter;
      const summary = getWizardSummary(expert);
      const haystack = [
        expert.name,
        expert.specialty,
        expert.location,
        summary.oneLineIntro,
        summary.philosophy,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        keyword.length === 0 || haystack.includes(keyword);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, experts, search]);

  async function writeApprovalAnalytics(expert: Expert, status: ApprovalStatus) {
    if (status === "pending") {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    const eventName =
      status === "approved" ? "expert_approved" : "expert_rejected";
    const { data } = await supabase.auth.getUser();

    await supabase.from("analytics_events").insert([
      {
        user_id: data.user?.id ?? null,
        event_name: eventName,
        page: "/admin/experts",
        metadata: {
          event_type: eventName,
          expert_id: expert.id,
          expert_name: expert.name,
          status,
        },
      },
    ]);
  }

  async function updateExpertStatus(expert: Expert, status: ApprovalStatus) {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    setUpdatingId(expert.id);

    const approved = status === "approved";
    const payload = {
      approved,
      approval_status: status,
      status,
    };

    const { error } = await supabase
      .from("experts")
      .update(payload)
      .eq("id", expert.id);

    if (error) {
      const fallback = await supabase
        .from("experts")
        .update({ approved, status })
        .eq("id", expert.id);

      if (fallback.error) {
        const approvedOnly = await supabase
          .from("experts")
          .update({ approved })
          .eq("id", expert.id);

        if (approvedOnly.error) {
          alert(getFriendlyErrorMessage(approvedOnly.error.message));
          setUpdatingId(null);
          return;
        }
      }
    }

    await writeApprovalAnalytics(expert, status);
    setUpdatingId(null);
    setSelectedExpert(null);
    setSuccessMessage(
      status === "approved"
        ? `${expert.name} 전문가를 승인했습니다.`
        : status === "rejected"
          ? `${expert.name} 전문가를 거절했습니다.`
          : `${expert.name} 전문가를 보류 상태로 변경했습니다.`
    );
    await refreshExperts();
  }

  async function updatePlanType(expert: Expert, planType: "free" | "premium") {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    setUpdatingId(expert.id);

    const { error } = await supabase
      .from("experts")
      .update({ plan_type: planType })
      .eq("id", expert.id);

    setUpdatingId(null);

    if (error) {
      alert(getFriendlyErrorMessage(error.message));
      return;
    }

    setExperts((current) =>
      current.map((item) =>
        item.id === expert.id ? { ...item, plan_type: planType } : item
      )
    );
    setSelectedExpert((current) =>
      current && current.id === expert.id
        ? { ...current, plan_type: planType }
        : current
    );
    setSuccessMessage(`${expert.name} 전문가 플랜을 ${planType}로 변경했습니다.`);
  }

  function openReviewModal(expert: Expert) {
    setSelectedExpert(expert);
    setAdminMemo(expert.admin_approval_memo || "");
    setAdminInterviewDone(Boolean(expert.admin_interview_done));
    setAdminInterviewMemo(expert.admin_interview_memo || "");
    setAdminSiteVisitDone(Boolean(expert.admin_site_visit_done));
    setAdminVideoShootDone(Boolean(expert.admin_video_shoot_done));
    setAdminVideoUrl(expert.admin_video_url || "");
    setAdminFeaturedImage(expert.admin_featured_image || "");
    setAdminVerificationComment(expert.admin_verification_comment || "");
    setAdminInternalScore(
      typeof expert.admin_internal_score === "number"
        ? String(expert.admin_internal_score)
        : ""
    );
    setChecklistState({
      identity: false,
      career: false,
      qualification: false,
      interview: false,
      caseReview: false,
    });
    setQualityChecklistState({
      photo: Boolean(getPrimaryImage(expert)),
      specialty: Boolean(expert.specialty),
      description: Boolean(expert.description),
      careerInfo: Boolean(expert.career),
      certification: getCertifications(expert.certifications).length > 0,
      casePortfolio: Boolean(getWizardSummary(expert).casePortfolio),
      consultationMethod: Boolean(getWizardSummary(expert).consultationMethods),
      contactAvailability: Boolean(getWizardSummary(expert).phone),
    });
  }

  function toggleChecklistItem(key: VerificationCheckKey) {
    setChecklistState((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function toggleQualityChecklistItem(key: QualityCheckKey) {
    setQualityChecklistState((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  async function saveAdminVerification(expert: Expert) {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    setUpdatingId(expert.id);

    const payload = {
      admin_interview_done: adminInterviewDone,
      admin_interview_memo: adminInterviewMemo.trim(),
      admin_site_visit_done: adminSiteVisitDone,
      admin_video_shoot_done: adminVideoShootDone,
      admin_video_url: adminVideoUrl.trim(),
      admin_featured_image: adminFeaturedImage.trim(),
      admin_verification_comment: adminVerificationComment.trim(),
      admin_internal_score: adminInternalScore.trim()
        ? Number(adminInternalScore)
        : null,
      admin_approval_memo: adminMemo.trim(),
    };

    const { error } = await supabase
      .from("experts")
      .update(payload)
      .eq("id", expert.id);

    setUpdatingId(null);

    if (error) {
      console.error("admin verification save error", error);
      alert(getFriendlyErrorMessage(error.message));
      return;
    }

    setSuccessMessage(`${expert.name} 전문가 검증 자료를 저장했습니다.`);
    await refreshExperts();
  }

  const selectedSummary = selectedExpert
    ? getWizardSummary(selectedExpert)
    : null;
  const selectedCertifications = selectedExpert
    ? getCertifications(selectedExpert.certifications)
    : [];
  const selectedCompletenessScore = selectedExpert
    ? getProfileCompletenessScore(selectedExpert)
    : 0;
  const qualityCompletionRate = Math.round(
    (Object.values(qualityChecklistState).filter(Boolean).length /
      profileQualityChecklist.length) *
      100
  );

  return (
    <main className="min-h-screen bg-[#F6F3EC] px-4 py-6 text-[#111111] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
            Expert Verification
          </p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-end">
            <div>
              <h1 className="text-4xl font-black text-[#111111]">
                전문가 승인 관리
              </h1>
              <p className="mt-3 text-sm font-bold leading-6 text-[#374151]">
                제출된 정보를 검토하고 승인된 전문가만 서비스에 노출하세요.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                ["전체 신청", counts.all],
                ["승인 대기", counts.pending],
                ["승인 완료", counts.approved],
                ["거절", counts.rejected],
                ["보류", counts.hold],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-4"
                >
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#374151]">
                    {label}
                  </p>
                  <p className="mt-2 text-3xl font-black text-[#111111]">
                    {value}명
                  </p>
                </div>
              ))}
            </div>
          </div>

          {successMessage ? (
            <div className="mt-5 rounded-[8px] border border-[#B7E3C9] bg-[#E8F2EC] p-4 text-sm font-black text-[#0F5132]">
              {successMessage}
            </div>
          ) : null}

          <div className="mt-7 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="이름, 분야, 지역으로 검색"
              className="min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
            />
            <div className="grid grid-cols-4 gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  className={`rounded-[8px] border px-3 py-3 text-sm font-black transition ${
                    activeFilter === filter.value
                      ? "border-[#111111] bg-[#111111] text-white"
                      : "border-[#E5E7EB] bg-white text-[#111111] hover:border-[#111111]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4">
          {visibleExperts.map((expert) => {
            const status = getExpertStatus(expert);
            const certifications = getCertifications(expert.certifications);
            const summary = getWizardSummary(expert);
            const completenessScore = getProfileCompletenessScore(expert);

            return (
              <article
                key={expert.id}
                className="rounded-[8px] border border-[#E5E7EB] bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_55px_rgba(24,24,20,0.08)] sm:p-5"
              >
                <div className="grid gap-5 lg:grid-cols-[140px_minmax(0,1fr)_auto] lg:items-start">
                  <div className="h-36 overflow-hidden rounded-[8px] bg-[#E5E7EB] lg:h-40">
                    {getPrimaryImage(expert) ? (
                      <Image
                        src={getPrimaryImage(expert)}
                        alt={expert.name}
                        width={280}
                        height={320}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#E8F2EC] text-5xl font-black text-[#0F5132]">
                        {expert.name.slice(0, 1)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black text-[#111111]">
                        {expert.name}
                      </h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClassName(
                          status
                        )}`}
                      >
                        {getStatusLabel(status)}
                      </span>
                      <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-black text-[#374151]">
                        {expert.plan_type === "premium" ? "PREMIUM" : "FREE"}
                      </span>
                    </div>

                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#D9CFBF] bg-white px-3 py-2">
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-[#374151]">
                        Plan
                      </span>
                      <select
                        value={expert.plan_type === "premium" ? "premium" : "free"}
                        onChange={(event) =>
                          updatePlanType(
                            expert,
                            event.target.value as "free" | "premium"
                          )
                        }
                        disabled={updatingId === expert.id}
                        className="bg-transparent text-sm font-black text-[#111111] outline-none"
                      >
                        <option value="free">free</option>
                        <option value="premium">premium</option>
                      </select>
                    </div>

                    <dl className="mt-4 grid gap-3 text-sm font-bold leading-6 text-[#374151] sm:grid-cols-2">
                      <div>
                        <dt className="font-black text-[#111111]">세부 분야</dt>
                        <dd>{expert.specialty}</dd>
                      </div>
                      <div>
                        <dt className="font-black text-[#111111]">활동 지역</dt>
                        <dd>{expert.location}</dd>
                      </div>
                      <div>
                        <dt className="font-black text-[#111111]">상담 방식</dt>
                        <dd>{summary.consultationMethods || "-"}</dd>
                      </div>
                      <div>
                        <dt className="font-black text-[#111111]">상담비</dt>
                        <dd>{expert.consultation_fee || "-"}</dd>
                      </div>
                      <div>
                        <dt className="font-black text-[#111111]">연락처</dt>
                        <dd>{summary.phone || "-"}</dd>
                      </div>
                      <div>
                        <dt className="font-black text-[#111111]">경력 년수</dt>
                        <dd>{summary.careerYears || "-"}</dd>
                      </div>
                      <div>
                        <dt className="font-black text-[#111111]">
                          프로필 완성도
                        </dt>
                        <dd>{completenessScore}점</dd>
                      </div>
                      <div>
                        <dt className="font-black text-[#111111]">자격증</dt>
                        <dd>{certifications.length > 0 ? certifications.join(", ") : "-"}</dd>
                      </div>
                    </dl>

                    <p className="mt-4 line-clamp-3 text-sm font-bold leading-7 text-[#374151]">
                      {expert.description || "소개가 입력되지 않았습니다."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3 text-sm">
                      {renderLink(expert.portfolio_url, "포트폴리오")}
                      {renderLink(expert.sns_url, "SNS")}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 lg:w-[180px] lg:flex-col">
                    <button
                      type="button"
                      onClick={() => openReviewModal(expert)}
                      className="rounded-full border border-[#D9CFBF] bg-white px-5 py-3 text-sm font-black text-[#111111] transition hover:border-[#111111]"
                    >
                      상세 검토
                    </button>
                    <button
                      type="button"
                      onClick={() => updateExpertStatus(expert, "approved")}
                      disabled={updatingId === expert.id}
                      className="rounded-full bg-[#0F5132] px-5 py-3 text-sm font-black text-white transition hover:bg-[#146C43] disabled:opacity-70"
                    >
                      승인
                    </button>
                    <button
                      type="button"
                      onClick={() => updateExpertStatus(expert, "pending")}
                      disabled={updatingId === expert.id}
                      className="rounded-full bg-[#F59E0B] px-5 py-3 text-sm font-black text-white transition hover:bg-[#D97706] disabled:opacity-70"
                    >
                      보류
                    </button>
                    <button
                      type="button"
                      onClick={() => updateExpertStatus(expert, "rejected")}
                      disabled={updatingId === expert.id}
                      className="rounded-full bg-[#9B1C1C] px-5 py-3 text-sm font-black text-white transition hover:bg-[#7F1D1D] disabled:opacity-70"
                    >
                      거절
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {visibleExperts.length === 0 ? (
            <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-8 text-center text-sm font-black text-[#374151]">
              조건에 맞는 전문가 신청이 없습니다.
            </div>
          ) : null}
        </section>
      </div>

      {selectedExpert && selectedSummary ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 px-4 py-6">
          <div className="mx-auto max-w-6xl rounded-[8px] bg-white shadow-[0_28px_90px_rgba(0,0,0,0.24)]">
            <div className="border-b border-[#E5E7EB] p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
                    Verification Review
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-[#111111]">
                    {selectedExpert.name}
                  </h2>
                  <p className="mt-2 text-sm font-bold text-[#374151]">
                    {selectedExpert.specialty} · {selectedExpert.location}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedExpert(null)}
                  className="rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-black text-[#111111] transition hover:border-[#111111]"
                >
                  닫기
                </button>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClassName(
                    getExpertStatus(selectedExpert)
                  )}`}
                >
                  {getStatusLabel(getExpertStatus(selectedExpert))}
                </span>
                <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-black text-[#374151]">
                  {selectedExpert.plan_type === "premium" ? "PREMIUM" : "FREE"}
                </span>
                <span className="rounded-full bg-[#E8F2EC] px-3 py-1 text-xs font-black text-[#0F5132]">
                  Completeness {selectedCompletenessScore}점
                </span>
                <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-black text-[#3730A3]">
                  Quality {qualityCompletionRate}%
                </span>
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
              <aside className="border-b border-[#E5E7EB] p-5 sm:p-7 lg:border-b-0 lg:border-r">
                <div className="overflow-hidden rounded-[8px] bg-[#E5E7EB]">
                  {getPrimaryImage(selectedExpert) ? (
                    <Image
                      src={getPrimaryImage(selectedExpert)}
                      alt={selectedExpert.name}
                      width={640}
                      height={640}
                      unoptimized
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center bg-[#E8F2EC] text-7xl font-black text-[#0F5132]">
                      {selectedExpert.name.slice(0, 1)}
                    </div>
                  )}
                </div>

                <section className="mt-5 rounded-[8px] bg-[#FBFAF7] p-4">
                  <h3 className="text-base font-black text-[#111111]">
                    검증 체크리스트
                  </h3>
                  <div className="mt-3 grid gap-2">
                    {verificationChecklist.map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center gap-3 rounded-[8px] bg-white p-3 text-sm font-black text-[#111111]"
                      >
                        <input
                          type="checkbox"
                          checked={checklistState[item.key]}
                          onChange={() => toggleChecklistItem(item.key)}
                          className="h-4 w-4 accent-[#0F5132]"
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </section>

                <section className="mt-5 rounded-[8px] bg-[#FBFAF7] p-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0F5132]">
                        Profile Quality
                      </p>
                      <h3 className="mt-2 text-base font-black text-[#111111]">
                        프로필 품질 체크
                      </h3>
                    </div>
                    <p className="text-3xl font-black tracking-[-0.04em] text-[#111111]">
                      {qualityCompletionRate}%
                    </p>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
                    <div
                      className="h-full rounded-full bg-[#0F5132]"
                      style={{ width: `${qualityCompletionRate}%` }}
                    />
                  </div>
                  <div className="mt-4 grid gap-2">
                    {profileQualityChecklist.map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center gap-3 rounded-[8px] bg-white p-3 text-sm font-black text-[#111111]"
                      >
                        <input
                          type="checkbox"
                          checked={qualityChecklistState[item.key]}
                          onChange={() => toggleQualityChecklistItem(item.key)}
                          className="h-4 w-4 accent-[#0F5132]"
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </section>

                <section className="mt-5 rounded-[8px] bg-[#FBFAF7] p-4">
                  <h3 className="text-base font-black text-[#111111]">
                    관리자 메모
                  </h3>
                  <textarea
                    value={adminMemo}
                    onChange={(event) => setAdminMemo(event.target.value)}
                    placeholder="승인 사유 또는 보완이 필요한 부분을 기록하세요."
                    className="mt-3 min-h-32 w-full resize-y rounded-[8px] border border-[#D9CFBF] bg-white px-4 py-3 text-sm font-bold leading-6 text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
                  />
                </section>

                <section className="mt-5 rounded-[8px] border border-[#D9CFBF] bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#374151]">
                    Plan Type
                  </p>
                  <select
                    value={
                      selectedExpert.plan_type === "premium" ? "premium" : "free"
                    }
                    onChange={(event) =>
                      updatePlanType(
                        selectedExpert,
                        event.target.value as "free" | "premium"
                      )
                    }
                    disabled={updatingId === selectedExpert.id}
                    className="mt-2 min-h-11 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-black text-[#111111] outline-none"
                  >
                    <option value="free">Free Plan</option>
                    <option value="premium">Premium Plan</option>
                  </select>
                </section>
              </aside>

              <div className="p-5 sm:p-7">
                <div className="grid gap-4">
                  {[
                    {
                      title: "Basic Info",
                      rows: [
                        ["이름", selectedExpert.name],
                        ["연락처", selectedSummary.phone || "-"],
                        [
                          "세부 분야",
                          selectedExpert.specialties?.length
                            ? selectedExpert.specialties.join(", ")
                            : selectedExpert.specialty,
                        ],
                        ["활동 지역", selectedExpert.activity_area || selectedExpert.location],
                        ["상세 위치", selectedExpert.detailed_location || "-"],
                        ["센터/장소", selectedExpert.center_name || "-"],
                        ["지도 주소", selectedExpert.map_address || "-"],
                        ["상담 방식", selectedSummary.consultationMethods || "-"],
                        ["상담비", selectedExpert.consultation_fee || "-"],
                      ],
                    },
                    {
                      title: "Expertise",
                      rows: [
                        ["경력 년수", selectedSummary.careerYears || "-"],
                        ["주요 경력", selectedSummary.careerHighlights || "-"],
                      ],
                    },
                    {
                      title: "Verification",
                      rows: [
                        [
                          "자격/증빙",
                          selectedCertifications.length > 0
                            ? selectedCertifications.join(", ")
                            : "-",
                        ],
                        [
                          "포트폴리오",
                          selectedExpert.portfolio_url ? "링크 있음" : "선택 입력 없음",
                        ],
                        [
                          "SNS/웹사이트",
                          selectedExpert.sns_url ? "링크 있음" : "선택 입력 없음",
                        ],
                        [
                          "전문가 영상",
                          selectedExpert.video_url ? "링크 있음" : "선택 입력 없음",
                        ],
                      ],
                    },
                    {
                      title: "Philosophy",
                      rows: [
                        ["한 줄 소개", selectedSummary.oneLineIntro || "-"],
                        ["전문가 철학", selectedSummary.philosophy || "-"],
                        ["기타 소개", selectedExpert.extra_intro || "-"],
                        ["대표 사례", selectedSummary.casePortfolio || "-"],
                      ],
                    },
                    {
                      title: "Case Portfolio",
                      rows: [["대표 사례", selectedSummary.casePortfolio || "-"]],
                    },
                  ].map((section) => (
                    <section
                      key={section.title}
                      className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-4"
                    >
                      <h3 className="text-lg font-black text-[#111111]">
                        {section.title}
                      </h3>
                      <dl className="mt-4 grid gap-3 text-sm font-bold leading-7 text-[#374151] md:grid-cols-2">
                        {section.rows.map(([label, value]) => (
                          <div key={label} className="rounded-[8px] bg-white p-4">
                            <dt className="font-black text-[#111111]">{label}</dt>
                            <dd className="mt-1 whitespace-pre-wrap">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  ))}

                  <section className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-4">
                    <h3 className="text-lg font-black text-[#111111]">
                      Profile Images
                    </h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {(selectedExpert.profile_images || [])
                        .filter(Boolean)
                        .map((url) => (
                          <div
                            key={url}
                            className="overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white"
                          >
                            <Image
                              src={url}
                              alt={`${selectedExpert.name} 프로필 사진`}
                              width={320}
                              height={240}
                              unoptimized
                              className="aspect-[4/3] w-full object-cover"
                            />
                            {url === getPrimaryImage(selectedExpert) ? (
                              <p className="p-3 text-xs font-black text-[#0F5132]">
                                대표 사진
                              </p>
                            ) : null}
                          </div>
                        ))}
                      {(selectedExpert.profile_images || []).length === 0 ? (
                        <p className="rounded-[8px] bg-white p-4 text-sm font-bold text-[#374151]">
                          등록된 추가 사진이 없습니다.
                        </p>
                      ) : null}
                    </div>
                  </section>

                  <section className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-4">
                    <h3 className="text-lg font-black text-[#111111]">
                      관리자 검증 자료
                    </h3>
                    <div className="mt-4 grid gap-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        {[
                          ["인터뷰 진행", adminInterviewDone, setAdminInterviewDone],
                          ["현장 방문", adminSiteVisitDone, setAdminSiteVisitDone],
                          ["영상 촬영", adminVideoShootDone, setAdminVideoShootDone],
                        ].map(([label, checked, setter]) => (
                          <label
                            key={label as string}
                            className="flex items-center gap-3 rounded-[8px] bg-white p-3 text-sm font-black text-[#111111]"
                          >
                            <input
                              type="checkbox"
                              checked={checked as boolean}
                              onChange={(event) =>
                                (setter as (value: boolean) => void)(
                                  event.target.checked
                                )
                              }
                              className="h-4 w-4 accent-[#0F5132]"
                            />
                            {label as string}
                          </label>
                        ))}
                      </div>
                      <textarea
                        value={adminInterviewMemo}
                        onChange={(event) => setAdminInterviewMemo(event.target.value)}
                        placeholder="인터뷰 메모"
                        className="min-h-24 w-full resize-y rounded-[8px] border border-[#D9CFBF] bg-white px-4 py-3 text-sm font-bold leading-6 text-[#111111] outline-none placeholder:text-[#9CA3AF]"
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <input
                          value={adminVideoUrl}
                          onChange={(event) => setAdminVideoUrl(event.target.value)}
                          placeholder="관리자 영상 URL"
                          className="min-h-11 rounded-[8px] border border-[#D9CFBF] bg-white px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF]"
                        />
                        <input
                          value={adminFeaturedImage}
                          onChange={(event) =>
                            setAdminFeaturedImage(event.target.value)
                          }
                          placeholder="대표 촬영 이미지 URL"
                          className="min-h-11 rounded-[8px] border border-[#D9CFBF] bg-white px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF]"
                        />
                      </div>
                      <textarea
                        value={adminVerificationComment}
                        onChange={(event) =>
                          setAdminVerificationComment(event.target.value)
                        }
                        placeholder="TRUPICK 검증 코멘트"
                        className="min-h-24 w-full resize-y rounded-[8px] border border-[#D9CFBF] bg-white px-4 py-3 text-sm font-bold leading-6 text-[#111111] outline-none placeholder:text-[#9CA3AF]"
                      />
                      <input
                        value={adminInternalScore}
                        onChange={(event) => setAdminInternalScore(event.target.value)}
                        placeholder="내부 검증 점수 예: 93"
                        type="number"
                        className="min-h-11 rounded-[8px] border border-[#D9CFBF] bg-white px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF]"
                      />
                      <button
                        type="button"
                        onClick={() => saveAdminVerification(selectedExpert)}
                        disabled={updatingId === selectedExpert.id}
                        className="w-fit rounded-full bg-[#111111] px-6 py-3 text-sm font-black text-white transition hover:bg-[#0F5132] disabled:opacity-70"
                      >
                        관리자 검증 자료 저장
                      </button>
                    </div>
                  </section>

                  <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-5">
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-[#0F5132]">
                      Profile Preview
                    </p>
                    <h3 className="mt-3 text-2xl font-black text-[#111111]">
                      {selectedExpert.name}
                    </h3>
                    <p className="mt-2 text-sm font-bold leading-6 text-[#374151]">
                      {selectedExpert.specialty} · {selectedExpert.location}
                    </p>
                    <p className="mt-4 text-sm font-bold leading-7 text-[#374151]">
                      {selectedSummary.oneLineIntro ||
                        selectedSummary.philosophy ||
                        selectedExpert.description ||
                        "소개가 입력되지 않았습니다."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm">
                      {renderLink(selectedExpert.portfolio_url, "포트폴리오 열기")}
                      {renderLink(selectedExpert.sns_url, "SNS 열기")}
                    </div>
                  </section>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateExpertStatus(selectedExpert, "approved")}
                    disabled={updatingId === selectedExpert.id}
                    className="rounded-full bg-[#0F5132] px-6 py-3 text-sm font-black text-white transition hover:bg-[#146C43] disabled:opacity-70"
                  >
                    승인
                  </button>
                  <button
                    type="button"
                    onClick={() => updateExpertStatus(selectedExpert, "pending")}
                    disabled={updatingId === selectedExpert.id}
                    className="rounded-full bg-[#F59E0B] px-6 py-3 text-sm font-black text-white transition hover:bg-[#D97706] disabled:opacity-70"
                  >
                    보류
                  </button>
                  <button
                    type="button"
                    onClick={() => updateExpertStatus(selectedExpert, "rejected")}
                    disabled={updatingId === selectedExpert.id}
                    className="rounded-full bg-[#9B1C1C] px-6 py-3 text-sm font-black text-white transition hover:bg-[#7F1D1D] disabled:opacity-70"
                  >
                    거절
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
