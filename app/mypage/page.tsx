"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getFriendlyErrorMessage } from "@/app/errorMessages";
import {
  getProfileCompleteness,
  ProfileCompletenessInput,
} from "@/app/profileCompleteness";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

type UserRole = "customer" | "expert" | "admin";

type Profile = {
  name: string | null;
  role: UserRole;
};

type ConsultationRequest = {
  id: number;
  expert_id: number | null;
  expert_name?: string | null;
  customer_name: string;
  phone?: string;
  customer_email?: string;
  customer_phone?: string;
  category?: string;
  message: string;
  status: string | null;
  created_at: string;
};

type ExpertProfile = ProfileCompletenessInput & {
  id: number;
  name: string;
  specialty: string;
  location: string;
  approved: boolean | null;
  status?: string | null;
  approval_status?: string | null;
  profile_completion_score?: number | null;
};

type ReviewRecord = {
  request_id: number | null;
};

type StructuredRequestMessage = {
  expert_name?: string | null;
  customer_name?: string;
  goal?: string;
  method?: string;
  preferred_day?: string;
  preferred_time?: string;
};

const adminCards = [
  {
    title: "전문가 승인 관리",
    description: "검증 전문가 신청을 검토하고 승인 상태를 관리합니다.",
    href: "/admin/experts",
  },
  {
    title: "상담 요청 관리",
    description: "상담 요청 상태를 연락 완료, 진행중, 완료로 업데이트합니다.",
    href: "/admin/requests",
  },
  {
    title: "리뷰 관리",
    description: "고객 리뷰를 확인하고 필요한 경우 삭제합니다.",
    href: "/admin/reviews",
  },
  {
    title: "피드백 관리",
    description: "베타 피드백 흐름과 제출 이벤트를 확인합니다.",
    href: "/admin/feedback",
  },
  {
    title: "Premium 신청 관리",
    description: "전문가 Premium 전환 신청을 확인하고 안내 상태를 관리합니다.",
    href: "/admin/premium-requests",
  },
  {
    title: "분석 페이지",
    description: "방문, 상담, AI 추천, 카테고리 데이터를 확인합니다.",
    href: "/admin/analytics",
  },
  {
    title: "베타 체크리스트",
    description: "베타 테스트 전 운영 점검 항목과 준비 상태를 확인합니다.",
    href: "/admin/beta-checklist",
  },
];

function parseMessage(message: string): StructuredRequestMessage {
  try {
    const parsed = JSON.parse(message) as StructuredRequestMessage;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeRequestStatus(status: string | null) {
  if (status === "accepted") {
    return "accepted";
  }

  if (status === "rejected") {
    return "rejected";
  }

  if (status === "contacted") {
    return "contacted";
  }

  if (status === "in_progress" || status === "matched") {
    return "in_progress";
  }

  if (status === "completed") {
    return "completed";
  }

  if (status === "cancelled" || status === "canceled") {
    return "cancelled";
  }

  return "pending";
}

function getRequestStatusLabel(status: string | null) {
  const normalized = normalizeRequestStatus(status);

  if (normalized === "accepted") {
    return "수락";
  }

  if (normalized === "rejected") {
    return "거절";
  }

  if (normalized === "contacted") {
    return "연락 완료";
  }

  if (normalized === "in_progress") {
    return "상담 진행중";
  }

  if (normalized === "completed") {
    return "상담 완료";
  }

  if (normalized === "cancelled") {
    return "취소";
  }

  return "대기중";
}

function getRequestStatusClassName(status: string | null) {
  const normalized = normalizeRequestStatus(status);

  if (normalized === "completed") {
    return "bg-[#E8F2EC] text-[#0F5132]";
  }

  if (normalized === "accepted") {
    return "bg-[#EAF0FF] text-[#274690]";
  }

  if (normalized === "rejected") {
    return "bg-[#FEE2E2] text-[#991B1B]";
  }

  if (normalized === "in_progress") {
    return "bg-[#FFF4E5] text-[#875200]";
  }

  if (normalized === "contacted") {
    return "bg-[#EAF0FF] text-[#274690]";
  }

  if (normalized === "cancelled") {
    return "bg-[#F3F4F6] text-[#374151]";
  }

  return "bg-[#111111] text-white";
}

function getExpertApprovalStatus(expert: ExpertProfile | null) {
  if (!expert) {
    return "pending";
  }

  if (expert.approval_status === "draft" || expert.status === "draft") {
    return "draft";
  }

  if (
    expert.approval_status === "pending_review" ||
    expert.status === "pending_review"
  ) {
    return "pending_review";
  }

  if (expert.approval_status === "rejected" || expert.status === "rejected") {
    return "rejected";
  }

  if (
    expert.approval_status === "approved" ||
    expert.status === "approved" ||
    expert.approved
  ) {
    return "approved";
  }

  return "pending";
}

function getExpertStatusLabel(status: string) {
  if (status === "draft") {
    return "임시 저장";
  }

  if (status === "pending_review") {
    return "재검토 대기";
  }

  if (status === "approved") {
    return "승인 완료";
  }

  if (status === "rejected") {
    return "거절";
  }

  return "승인 대기";
}

function getExpertStatusClassName(status: string) {
  if (status === "draft") {
    return "bg-[#F3F4F6] text-[#374151]";
  }

  if (status === "pending_review") {
    return "bg-[#EEF2FF] text-[#3730A3]";
  }

  if (status === "approved") {
    return "bg-[#E8F2EC] text-[#0F5132]";
  }

  if (status === "rejected") {
    return "bg-[#FEE2E2] text-[#991B1B]";
  }

  return "bg-[#FFF4E5] text-[#875200]";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function normalizeRole(value: unknown): UserRole {
  if (value === "admin" || value === "expert" || value === "customer") {
    return value;
  }

  return "customer";
}

export default function MyPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [expertProfile, setExpertProfile] = useState<ExpertProfile | null>(null);
  const [reviewedRequestIds, setReviewedRequestIds] = useState<Set<number>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadMyPage() {
      try {
        const supabase = getSupabaseBrowserClient();

        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError) {
          console.error("mypage auth user error", userError);
        }

        const user = userData.user;

        if (!isMounted) {
          return;
        }

        if (!user) {
          router.replace("/login?redirect=/mypage");
          return;
        }

        const fallbackName =
          (user.user_metadata?.name as string | undefined) ||
          (user.user_metadata?.full_name as string | undefined) ||
          user.email?.split("@")[0] ||
          "TRUPICK 사용자";
        const fallbackRole = normalizeRole(user.user_metadata?.role);

        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("name, role")
          .eq("id", user.id)
          .maybeSingle<Profile>();

        if (profileError) {
          console.error("mypage profiles lookup error", profileError);
        }

        if (!profileData) {
          const { error: profileCreateError } = await supabase
            .from("profiles")
            .upsert(
              [
                {
                  id: user.id,
                  name: fallbackName,
                  role: fallbackRole,
                },
              ],
              { onConflict: "id" }
            );

          if (profileCreateError) {
            console.error("mypage profile upsert error", profileCreateError);
          }
        }

        const nextProfile: Profile = {
          name: profileData?.name ?? fallbackName,
          role: normalizeRole(profileData?.role ?? fallbackRole),
        };

        if (!isMounted) {
          return;
        }

        setProfile(nextProfile);

        if (nextProfile.role === "admin") {
          setLoading(false);
          return;
        }

        if (nextProfile.role === "customer") {
          const { data: requestRows, error: requestError } = await supabase
            .from("requests")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .returns<ConsultationRequest[]>();

          if (requestError) {
            console.error("mypage requests lookup error", requestError);
            setRequests([]);
          } else {
            setRequests(requestRows || []);
          }

          const { data: reviewRows, error: reviewError } = await supabase
            .from("reviews")
            .select("request_id")
            .eq("user_id", user.id)
            .returns<ReviewRecord[]>();

          if (reviewError) {
            console.error("mypage reviews lookup error", reviewError);
            setReviewedRequestIds(new Set());
          } else {
            setReviewedRequestIds(
              new Set(
                (reviewRows || [])
                  .map((review) => review.request_id)
                  .filter(
                    (requestId): requestId is number =>
                      typeof requestId === "number"
                  )
              )
            );
          }

          setLoading(false);
          return;
        }

        const { data: expertData, error: expertError } = await supabase
          .from("experts")
          .select("*")
          .eq("user_id", user.id)
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle<ExpertProfile>();

        if (expertError) {
          console.error("mypage expert profile lookup error", expertError);
          setExpertProfile(null);
        } else {
          setExpertProfile(expertData ?? null);
        }

        if (expertData?.id) {
          const { data: incomingRequests, error: incomingRequestsError } =
            await supabase
              .from("consultation_requests")
              .select("*")
              .eq("expert_id", expertData.id)
              .order("created_at", { ascending: false })
              .returns<ConsultationRequest[]>();

          if (incomingRequestsError) {
            console.error(
              "mypage consultation_requests lookup error",
              incomingRequestsError
            );
            setRequests([]);
          } else {
            setRequests(incomingRequests || []);
          }
        } else {
          setRequests([]);
        }

        setLoading(false);
      } catch (error) {
        console.error("mypage load error", error);

        if (isMounted) {
          setErrorMessage(
            "마이페이지 일부 정보를 불러오지 못했습니다. 로그인 상태를 확인한 뒤 다시 시도해주세요."
          );
          setLoading(false);
        }
      }
    }

    void loadMyPage();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const completeness = useMemo(
    () => getProfileCompleteness(expertProfile || {}),
    [expertProfile]
  );
  const expertCompletenessScore =
    typeof expertProfile?.profile_completion_score === "number"
      ? expertProfile.profile_completion_score
      : completeness.score;
  const role = profile?.role ?? "customer";
  const completedRequests = requests.filter(
    (request) => normalizeRequestStatus(request.status) === "completed"
  );

  return (
    <main className="min-h-screen bg-[#F5F1E8] px-4 py-6 text-[#111111] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-[0.16em] text-[#111111]"
          >
            TRUPICK
          </Link>
          <Link
            href="/mypage/favorites"
            className="rounded-full border border-[#D9CFBF] bg-white px-4 py-2 text-sm font-black text-[#0F5132] transition hover:border-[#111111]"
          >
            저장한 전문가
          </Link>
        </header>

        <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
            My Page
          </p>
          <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
            <div>
              <h1 className="text-4xl font-black text-[#111111]">
                {profile?.name || "TRUPICK 사용자"}님의 마이페이지
              </h1>
              <p className="mt-3 text-sm font-bold leading-6 text-[#374151]">
                역할에 맞는 상담, 프로필, 운영 정보를 한곳에서 확인하세요.
              </p>
            </div>
            <div className="rounded-[8px] bg-[#FBFAF7] p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#374151]">
                Current Role
              </p>
              <p className="mt-2 text-3xl font-black text-[#111111]">
                {role}
              </p>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="mt-5 rounded-[8px] border border-[#E5E7EB] bg-white p-6 text-sm font-bold text-[#374151]">
            마이페이지 정보를 불러오는 중입니다.
          </section>
        ) : null}

        {errorMessage ? (
          <section className="mt-5 rounded-[8px] bg-[#FEE2E2] p-5 text-sm font-bold text-[#9B1C1C]">
            {errorMessage}
          </section>
        ) : null}

        {!loading && role === "customer" ? (
          <CustomerPanel
            requests={requests}
            reviewedRequestIds={reviewedRequestIds}
            completedCount={completedRequests.length}
          />
        ) : null}

        {!loading && role === "expert" ? (
          <ExpertPanel
            expertProfile={expertProfile}
            requests={requests}
            completenessScore={expertCompletenessScore}
          />
        ) : null}

        {!loading && role === "admin" ? <AdminPanel /> : null}
      </div>
    </main>
  );
}

function CustomerPanel({
  requests,
  reviewedRequestIds,
  completedCount,
}: {
  requests: ConsultationRequest[];
  reviewedRequestIds: Set<number>;
  completedCount: number;
}) {
  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
              Customer Dashboard
            </p>
            <h2 className="mt-2 text-3xl font-black">내 상담 요청</h2>
          </div>
          <Link
            href="/mypage/favorites"
            className="rounded-full bg-[#0F5132] px-5 py-3 text-sm font-black text-white"
          >
            저장한 전문가 보기
          </Link>
        </div>

        <div className="mt-5 grid gap-4">
          {requests.length === 0 ? (
            <div className="rounded-[8px] bg-[#FBFAF7] p-5 text-sm font-bold text-[#374151]">
              아직 상담 요청이 없습니다.
            </div>
          ) : (
            requests.map((request) => {
              const structured = parseMessage(request.message);
              const isCompleted =
                normalizeRequestStatus(request.status) === "completed";
              const hasReview = reviewedRequestIds.has(request.id);

              return (
                <article
                  key={request.id}
                  className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-black">
                          {request.expert_name ||
                            structured.expert_name ||
                            `Expert #${request.expert_id ?? "-"}`}
                        </h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${getRequestStatusClassName(
                            request.status
                          )}`}
                        >
                          {getRequestStatusLabel(request.status)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-bold leading-6 text-[#374151]">
                        {structured.goal || "상담 목적 미입력"} ·{" "}
                        {formatDate(request.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {isCompleted && request.expert_id && !hasReview ? (
                        <Link
                          href={`/experts/${request.expert_id}`}
                          className="rounded-full bg-[#0F5132] px-5 py-3 text-sm font-black text-white"
                        >
                          리뷰 작성
                        </Link>
                      ) : null}
                      {isCompleted && hasReview ? (
                        <span className="rounded-full bg-[#E8F2EC] px-5 py-3 text-sm font-black text-[#0F5132]">
                          리뷰 작성 완료
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <aside className="grid gap-4">
        <Link
          href="/mypage/favorites"
          className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#111111]"
        >
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0F5132]">
            Favorites
          </p>
          <p className="mt-2 text-2xl font-black text-[#111111]">
            저장한 전문가
          </p>
          <p className="mt-2 text-sm font-bold leading-6 text-[#374151]">
            관심 있는 전문가를 모아보고 상담 전 비교하세요.
          </p>
        </Link>
        <MetricCard label="상담 완료" value={`${completedCount}건`} />
        <MetricCard label="전체 상담 요청" value={`${requests.length}건`} />
      </aside>
    </div>
  );
}

function ExpertPanel({
  expertProfile,
  requests,
  completenessScore,
}: {
  expertProfile: ExpertProfile | null;
  requests: ConsultationRequest[];
  completenessScore: number;
}) {
  const approvalStatus = getExpertApprovalStatus(expertProfile);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [visibleRequests, setVisibleRequests] = useState(requests);

  async function changeConsultationStatus(id: number, status: string) {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    setUpdatingId(id);

    const { error } = await supabase
      .from("consultation_requests")
      .update({ status })
      .eq("id", id);

    setUpdatingId(null);

    if (error) {
      alert(getFriendlyErrorMessage(error.message));
      return;
    }

    setVisibleRequests((current) =>
      current.map((request) =>
        request.id === id ? { ...request, status } : request
      )
    );
  }

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
          Expert Profile
        </p>
        <h2 className="mt-2 text-3xl font-black">
          {expertProfile?.name || "전문가 프로필"}
        </h2>
        <p className="mt-3 text-sm font-bold leading-6 text-[#374151]">
          {expertProfile?.specialty || "등록된 전문가 프로필이 없습니다."}
        </p>
        <span
          className={`mt-5 inline-flex rounded-full px-4 py-2 text-sm font-black ${getExpertStatusClassName(
            approvalStatus
          )}`}
        >
          {getExpertStatusLabel(approvalStatus)}
        </span>

        <div className="mt-5 rounded-[8px] bg-[#FBFAF7] p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#374151]">
            Profile Completeness
          </p>
          <p className="mt-2 text-5xl font-black text-[#111111]">
            {completenessScore}%
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
            <div
              className="h-full rounded-full bg-[#0F5132]"
              style={{ width: `${completenessScore}%` }}
            />
          </div>
        </div>

        <Link
          href="/register?mode=edit"
          className="mt-5 block rounded-full bg-[#0F5132] px-5 py-3 text-center text-sm font-black text-white"
        >
          프로필 수정
        </Link>
      </aside>

      <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
          Incoming Requests
        </p>
        <h2 className="mt-2 text-3xl font-black">내게 들어온 상담 요청</h2>
        <div className="mt-5 grid gap-4">
          {visibleRequests.length === 0 ? (
            <div className="rounded-[8px] bg-[#FBFAF7] p-5 text-sm font-bold text-[#374151]">
              아직 들어온 상담 요청이 없습니다.
            </div>
          ) : (
            visibleRequests.map((request) => {
              const structured = parseMessage(request.message);

              return (
                <article
                  key={request.id}
                  className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black">
                        {structured.customer_name || request.customer_name}
                      </h3>
                      <p className="mt-2 text-sm font-bold leading-6 text-[#374151]">
                        {request.category || structured.goal || "상담 목적 미입력"} ·{" "}
                        {formatDate(request.created_at)}
                      </p>
                      <p className="mt-2 text-sm font-bold leading-6 text-[#4B5563]">
                        {request.customer_email || "이메일 미입력"} ·{" "}
                        {request.customer_phone || request.phone || "연락처 미입력"}
                      </p>
                      <p className="mt-3 whitespace-pre-wrap text-sm font-bold leading-7 text-[#111111]">
                        {request.message}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-black ${getRequestStatusClassName(
                          request.status
                        )}`}
                      >
                        {getRequestStatusLabel(request.status)}
                      </span>
                      <select
                        value={request.status || "pending"}
                        onChange={(event) =>
                          changeConsultationStatus(request.id, event.target.value)
                        }
                        disabled={updatingId === request.id}
                        className="min-h-10 rounded-full border border-[#D9CFBF] bg-white px-3 text-xs font-black text-[#111111]"
                      >
                        <option value="pending">대기중</option>
                        <option value="accepted">수락</option>
                        <option value="rejected">거절</option>
                        <option value="completed">완료</option>
                      </select>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function AdminPanel() {
  return (
    <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {adminCards.map((card) => (
        <Link
          key={card.title}
          href={card.href}
          className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#111111]"
        >
          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#0F5132]">
            Admin
          </p>
          <h2 className="mt-3 text-2xl font-black text-[#111111]">
            {card.title}
          </h2>
          <p className="mt-3 text-sm font-bold leading-6 text-[#374151]">
            {card.description}
          </p>
        </Link>
      ))}
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#374151]">
        {label}
      </p>
      <p className="mt-2 text-4xl font-black text-[#111111]">{value}</p>
    </div>
  );
}
