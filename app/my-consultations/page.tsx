"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";
import { getFriendlyErrorMessage } from "@/app/errorMessages";

type ConsultationRequest = {
  id: number;
  expert_id: number | null;
  expert_name?: string | null;
  customer_name: string;
  phone: string;
  message: string;
  status: string | null;
  created_at: string;
};

type ReviewRecord = {
  request_id: number | null;
};

type StructuredRequestMessage = {
  expert_name?: string | null;
  goal?: string;
  method?: string;
  preferred_day?: string;
  preferred_time?: string;
};

function parseMessage(message: string): StructuredRequestMessage {
  try {
    const parsed = JSON.parse(message) as StructuredRequestMessage;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeStatus(status: string | null) {
  if (status === "completed") {
    return "completed";
  }

  if (status === "contacted") {
    return "contacted";
  }

  if (status === "in_progress" || status === "matched") {
    return "in_progress";
  }

  if (status === "cancelled" || status === "canceled") {
    return "cancelled";
  }

  return "pending";
}

function getStatusLabel(status: string | null) {
  const normalized = normalizeStatus(status);

  if (normalized === "completed") {
    return "상담 완료";
  }

  if (normalized === "contacted") {
    return "연락 완료";
  }

  if (normalized === "in_progress") {
    return "상담 진행중";
  }

  if (normalized === "cancelled") {
    return "취소";
  }

  return "신규";
}

function getStatusClassName(status: string | null) {
  const normalized = normalizeStatus(status);

  if (normalized === "completed") {
    return "bg-[#E8F2EC] text-[#0F5132]";
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export default function MyConsultationsPage() {
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [reviewedRequestIds, setReviewedRequestIds] = useState<Set<number>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadConsultations() {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (!userData.user) {
        setErrorMessage("로그인 후 상담 내역을 확인할 수 있습니다.");
        setLoading(false);
        return;
      }

      const { data: requestRows, error } = await supabase
        .from("requests")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false })
        .returns<ConsultationRequest[]>();

      if (!isMounted) {
        return;
      }

      if (error) {
        setErrorMessage(getFriendlyErrorMessage(error.message));
        setLoading(false);
        return;
      }

      const { data: reviewRows } = await supabase
        .from("reviews")
        .select("request_id")
        .eq("user_id", userData.user.id)
        .returns<ReviewRecord[]>();

      setRequests(requestRows || []);
      setReviewedRequestIds(
        new Set(
          (reviewRows || [])
            .map((review) => review.request_id)
            .filter((requestId): requestId is number => typeof requestId === "number")
        )
      );
      setLoading(false);
    }

    void loadConsultations();

    return () => {
      isMounted = false;
    };
  }, []);

  const completedCount = useMemo(
    () =>
      requests.filter((request) => normalizeStatus(request.status) === "completed")
        .length,
    [requests]
  );

  return (
    <main className="min-h-screen bg-[#F5F1E8] px-4 py-10 text-[#111111] sm:px-6 lg:px-10">
      <section className="mx-auto max-w-5xl rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
          My Consultations
        </p>
        <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
          <div>
            <h1 className="text-4xl font-black">내 상담</h1>
            <p className="mt-4 text-sm font-bold leading-7 text-[#4B5563]">
              상담 상태를 확인하고, 완료된 상담에는 리뷰를 남길 수 있습니다.
            </p>
          </div>
          <div className="rounded-[8px] bg-[#FBFAF7] p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#374151]">
              Completed
            </p>
            <p className="mt-2 text-3xl font-black text-[#111111]">
              {completedCount}건
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 rounded-[8px] bg-[#FBFAF7] p-5 text-sm font-bold leading-7 text-[#4B5563]">
            상담 내역을 불러오는 중입니다.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-6 rounded-[8px] bg-[#FEE2E2] p-5 text-sm font-bold leading-7 text-[#9B1C1C]">
            {errorMessage}
          </div>
        ) : null}

        {!loading && !errorMessage && requests.length === 0 ? (
          <div className="mt-6 rounded-[8px] bg-[#FBFAF7] p-5 text-sm font-bold leading-7 text-[#4B5563]">
            아직 표시할 상담 내역이 없습니다.
          </div>
        ) : null}

        <div className="mt-6 grid gap-4">
          {requests.map((request) => {
            const structured = parseMessage(request.message);
            const status = normalizeStatus(request.status);
            const isCompleted = status === "completed";
            const hasReview = reviewedRequestIds.has(request.id);

            return (
              <article
                key={request.id}
                className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black text-[#111111]">
                        {request.expert_name ||
                          structured.expert_name ||
                          `Expert #${request.expert_id ?? "-"}`}
                      </h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClassName(
                          request.status
                        )}`}
                      >
                        {getStatusLabel(request.status)}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm font-bold leading-6 text-[#374151] sm:grid-cols-3">
                      <div>
                        <span className="font-black text-[#111111]">목적</span>
                        <p>{structured.goal || "-"}</p>
                      </div>
                      <div>
                        <span className="font-black text-[#111111]">방식</span>
                        <p>{structured.method || "-"}</p>
                      </div>
                      <div>
                        <span className="font-black text-[#111111]">신청일</span>
                        <p>{formatDate(request.created_at)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {isCompleted && request.expert_id && !hasReview ? (
                      <Link
                        href={`/experts/${request.expert_id}`}
                        className="rounded-full bg-[#0F5132] px-5 py-3 text-sm font-black text-white transition hover:bg-[#146C43]"
                      >
                        리뷰 작성
                      </Link>
                    ) : null}
                    {isCompleted && hasReview ? (
                      <span className="rounded-full bg-[#E8F2EC] px-5 py-3 text-sm font-black text-[#0F5132]">
                        리뷰 작성 완료
                      </span>
                    ) : null}
                    {!isCompleted ? (
                      <span className="rounded-full border border-[#D9CFBF] bg-white px-5 py-3 text-sm font-black text-[#374151]">
                        상담 완료 후 리뷰 가능
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <Link
          href="/experts"
          className="mt-6 inline-flex rounded-full bg-[#0F5132] px-6 py-3 text-sm font-black text-white"
        >
          전문가 찾기
        </Link>
      </section>
    </main>
  );
}
