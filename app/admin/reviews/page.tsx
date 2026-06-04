"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";
import { getFriendlyErrorMessage } from "@/app/errorMessages";

type Review = {
  id: number;
  expert_id: number;
  user_id: string | null;
  rating: number;
  content: string;
  created_at: string;
};

type ExpertName = {
  id: number;
  name: string;
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

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [experts, setExperts] = useState<Record<number, string>>({});
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadReviews() {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    const [{ data: reviewRows, error }, { data: expertRows }] = await Promise.all([
      supabase
        .from("reviews")
        .select("id, expert_id, user_id, rating, content, created_at")
        .order("created_at", { ascending: false })
        .returns<Review[]>(),
      supabase.from("experts").select("id, name").returns<ExpertName[]>(),
    ]);

    if (error) {
      alert(getFriendlyErrorMessage(error.message));
      return;
    }

    setReviews(reviewRows || []);
    setExperts(
      (expertRows || []).reduce<Record<number, string>>((map, expert) => {
        map[expert.id] = expert.name;
        return map;
      }, {})
    );
  }

  useEffect(() => {
    let isMounted = true;

    async function run() {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        return;
      }

      const [{ data: reviewRows, error }, { data: expertRows }] =
        await Promise.all([
          supabase
            .from("reviews")
            .select("id, expert_id, user_id, rating, content, created_at")
            .order("created_at", { ascending: false })
            .returns<Review[]>(),
          supabase.from("experts").select("id, name").returns<ExpertName[]>(),
        ]);

      if (!isMounted) {
        return;
      }

      if (error) {
        alert(getFriendlyErrorMessage(error.message));
        return;
      }

      setReviews(reviewRows || []);
      setExperts(
        (expertRows || []).reduce<Record<number, string>>((map, expert) => {
          map[expert.id] = expert.name;
          return map;
        }, {})
      );
    }

    void run();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredReviews = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return reviews;
    }

    return reviews.filter((review) => {
      const expertName = experts[review.expert_id] || "";

      return (
        expertName.toLowerCase().includes(keyword) ||
        review.content.toLowerCase().includes(keyword)
      );
    });
  }, [experts, reviews, search]);

  async function deleteReview(id: number) {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    setDeletingId(id);

    const { error } = await supabase.from("reviews").delete().eq("id", id);

    setDeletingId(null);

    if (error) {
      alert(getFriendlyErrorMessage(error.message));
      return;
    }

    await loadReviews();
  }

  return (
    <main className="min-h-screen bg-[#F5F1E8] px-4 py-6 text-[#111111] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
            Review Management
          </p>
          <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
            <div>
              <h1 className="text-4xl font-black text-[#111111]">
                리뷰 관리
              </h1>
              <p className="mt-3 text-sm font-bold leading-6 text-[#374151]">
                전문가 리뷰를 확인하고 부적절한 리뷰는 삭제할 수 있습니다.
              </p>
            </div>
            <div className="rounded-[8px] bg-[#FBFAF7] p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#374151]">
                Total Reviews
              </p>
              <p className="mt-2 text-3xl font-black text-[#111111]">
                {reviews.length}개
              </p>
            </div>
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="전문가명 또는 리뷰 내용 검색"
            className="mt-6 min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
          />
        </section>

        <section className="mt-5 grid gap-4">
          {filteredReviews.length === 0 ? (
            <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-8 text-center text-sm font-black text-[#374151]">
              관리할 리뷰가 없습니다.
            </div>
          ) : (
            filteredReviews.map((review) => (
              <article
                key={review.id}
                className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black text-[#111111]">
                        {experts[review.expert_id] || `Expert #${review.expert_id}`}
                      </h2>
                      <span className="rounded-full bg-[#E8F2EC] px-3 py-1 text-xs font-black text-[#0F5132]">
                        visible
                      </span>
                      <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-black text-[#374151]">
                        신고/숨김 준비
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-black">
                      <Stars value={review.rating} />
                    </p>
                    <p className="mt-4 text-base font-bold leading-8 text-[#111111]">
                      {review.content}
                    </p>
                    <p className="mt-4 text-sm font-bold text-[#4B5563]">
                      작성자 {review.user_id?.slice(0, 8) || "unknown"} ·{" "}
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteReview(review.id)}
                    disabled={deletingId === review.id}
                    className="rounded-full bg-[#9B1C1C] px-5 py-3 text-sm font-black text-white transition hover:bg-[#7F1D1D] disabled:opacity-70"
                  >
                    삭제
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
