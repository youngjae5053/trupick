"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";
import { getFriendlyErrorMessage } from "@/app/errorMessages";
import { trackAnalyticsEvent } from "@/app/analytics";

export type ExpertReview = {
  id: number;
  expert_id: number;
  user_id: string | null;
  request_id?: number | null;
  rating: number;
  content: string;
  created_at: string;
};

type ReviewRequestState = {
  loading: boolean;
  canReview: boolean;
  requestId: number | null;
  completedCount: number;
  reviewedCount: number;
  message: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function Stars({ value }: { value: number }) {
  return (
    <span aria-label={`${value}점`} className="tracking-[0.08em] text-[#0F5132]">
      {"★".repeat(value)}
      <span className="text-[#D1D5DB]">{"★".repeat(5 - value)}</span>
    </span>
  );
}

export default function ExpertReviewsSection({
  expertId,
  expertName,
  initialReviews,
}: {
  expertId: number;
  expertName: string;
  initialReviews: ExpertReview[];
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestState, setRequestState] = useState<ReviewRequestState>({
    loading: true,
    canReview: false,
    requestId: null,
    completedCount: 0,
    reviewedCount: 0,
    message: "상담 완료 여부를 확인하고 있습니다.",
  });

  const stats = useMemo(() => {
    if (reviews.length === 0) {
      return { average: 0, count: 0 };
    }

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);

    return {
      average: total / reviews.length,
      count: reviews.length,
    };
  }, [reviews]);

  useEffect(() => {
    let isMounted = true;

    async function loadReviewPermission() {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        setRequestState({
          loading: false,
          canReview: false,
          requestId: null,
          completedCount: 0,
          reviewedCount: 0,
          message: "서비스 연결 설정을 확인하는 중입니다.",
        });
        return;
      }

      const { data: userData } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (!userData.user) {
        setRequestState({
          loading: false,
          canReview: false,
          requestId: null,
          completedCount: 0,
          reviewedCount: 0,
          message: "로그인한 사용자만 리뷰를 작성할 수 있습니다.",
        });
        return;
      }

      const { data: requests } = await supabase
        .from("requests")
        .select("id, status")
        .eq("expert_id", expertId)
        .eq("user_id", userData.user.id)
        .in("status", ["completed"])
        .order("created_at", { ascending: false })
        .returns<Array<{ id: number; status: string | null }>>();

      const completedRequests = requests || [];
      const completedRequestIds = completedRequests.map((request) => request.id);

      if (completedRequestIds.length === 0) {
        setRequestState({
          loading: false,
          canReview: false,
          requestId: null,
          completedCount: 0,
          reviewedCount: 0,
          message: "상담 완료 후 리뷰를 작성할 수 있습니다.",
        });
        return;
      }

      const { data: writtenReviews } = await supabase
        .from("reviews")
        .select("request_id")
        .eq("user_id", userData.user.id)
        .eq("expert_id", expertId)
        .in("request_id", completedRequestIds)
        .returns<Array<{ request_id: number | null }>>();

      const reviewedRequestIds = new Set(
        (writtenReviews || [])
          .map((review) => review.request_id)
          .filter((requestId): requestId is number => typeof requestId === "number")
      );
      const nextRequest = completedRequests.find(
        (request) => !reviewedRequestIds.has(request.id)
      );

      setRequestState({
        loading: false,
        canReview: Boolean(nextRequest),
        requestId: nextRequest?.id ?? null,
        completedCount: completedRequests.length,
        reviewedCount: reviewedRequestIds.size,
        message: nextRequest
          ? "완료된 상담에 대한 리뷰를 작성할 수 있습니다."
          : "리뷰 작성 완료",
      });
    }

    void loadReviewPermission();

    return () => {
      isMounted = false;
    };
  }, [expertId, reviews]);

  async function submitReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setMessage("서비스 연결 설정을 확인하는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setMessage("로그인한 사용자만 리뷰를 작성할 수 있습니다.");
      return;
    }

    if (content.trim().length === 0) {
      setMessage("후기 내용을 입력해주세요.");
      return;
    }

    if (!requestState.canReview || !requestState.requestId) {
      setMessage("상담 완료 후 리뷰를 작성할 수 있습니다.");
      return;
    }

    setSubmitting(true);

    const payload = {
      expert_id: expertId,
      user_id: userData.user.id,
      request_id: requestState.requestId,
      rating,
      content: content.trim(),
    };

    const { data, error } = await supabase
      .from("reviews")
      .insert([payload])
      .select("id, expert_id, user_id, request_id, rating, content, created_at")
      .single<ExpertReview>();

    setSubmitting(false);

    if (error) {
      setMessage(getFriendlyErrorMessage(error.message));
      return;
    }

    if (data) {
      setReviews((current) => [data, ...current]);
      setRequestState((current) => ({
        ...current,
        canReview: false,
        requestId: null,
        reviewedCount: current.reviewedCount + 1,
        message: "리뷰 작성 완료",
      }));
    }

    setContent("");
    setRating(5);
    setMessage("리뷰가 등록되었습니다.");

    void trackAnalyticsEvent({
      eventName: "review_created",
      page: `/experts/${expertId}`,
      metadata: {
        expert_id: expertId,
        expert_name: expertName,
        rating,
      },
    });
  }

  return (
    <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
        Reviews
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#111111]">리뷰</h2>
          <p className="mt-2 text-sm font-bold text-[#374151]">
            {stats.count > 0
              ? `평균 ${stats.average.toFixed(2)}점 · 리뷰 ${stats.count}개`
              : "아직 리뷰가 없습니다. 첫 리뷰를 남겨보세요."}
          </p>
        </div>
        <div className="rounded-[8px] bg-[#FBFAF7] px-4 py-3 text-right">
          <p className="text-sm font-black text-[#0F5132]">
            <Stars value={Math.round(stats.average || 0)} />
          </p>
          <p className="mt-1 text-2xl font-black text-[#111111]">
            {stats.average > 0 ? stats.average.toFixed(2) : "0.00"}
          </p>
        </div>
      </div>

      {requestState.canReview ? (
        <form
          onSubmit={submitReview}
          className="mt-6 rounded-[8px] bg-[#FBFAF7] p-4"
        >
          <p className="text-sm font-black text-[#111111]">리뷰 작성</p>
          <p className="mt-2 text-sm font-bold text-[#374151]">
            완료 상담 #{requestState.requestId}에 대한 리뷰입니다.
          </p>
          <div className="mt-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => setRating(score)}
                className={`h-10 w-10 rounded-full text-xl font-black transition ${
                  score <= rating
                    ? "bg-[#0F5132] text-white"
                    : "bg-white text-[#9CA3AF]"
                }`}
                aria-label={`${score}점`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="상담 경험과 도움이 되었던 점을 남겨주세요."
            className="mt-4 min-h-28 w-full resize-y rounded-[8px] border border-[#D9CFBF] bg-white px-4 py-3 text-sm font-bold leading-7 text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
          />
          {message ? (
            <p className="mt-3 text-sm font-bold leading-6 text-[#0F5132]">
              {message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 rounded-full bg-[#0F5132] px-6 py-3 text-sm font-black text-white transition hover:bg-[#146C43] disabled:opacity-70"
          >
            {submitting ? "제출 중..." : "리뷰 제출"}
          </button>
        </form>
      ) : (
        <div className="mt-6 rounded-[8px] bg-[#FBFAF7] p-5 text-sm font-black leading-7 text-[#374151]">
          {requestState.loading
            ? "상담 완료 여부를 확인하고 있습니다."
            : requestState.message}
        </div>
      )}

      <div className="mt-6 grid gap-4">
        {reviews.length === 0 ? (
          <div className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-5 text-sm font-bold text-[#374151]">
            아직 리뷰가 없습니다. 첫 리뷰를 남겨보세요.
          </div>
        ) : (
          reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-5"
            >
              <p className="font-black text-[#0F5132]">
                <Stars value={review.rating} />
              </p>
              <p className="mt-4 text-base font-bold leading-8 text-[#111111]">
                {review.content}
              </p>
              <p className="mt-4 text-sm font-bold text-[#4B5563]">
                TRUPICK 고객 · {formatDate(review.created_at)}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
