"use client";

import { useEffect, useMemo, useState } from "react";
import { getFriendlyErrorMessage } from "@/app/errorMessages";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

type FeedbackRow = {
  id: number;
  nickname: string;
  purpose: string;
  satisfaction: number;
  liked: string;
  pain_point: string;
  improvement_idea: string;
  reuse_intent: string;
  created_at: string;
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

function getReuseClassName(value: string) {
  if (value === "있음") {
    return "bg-[#E8F2EC] text-[#0F5132]";
  }

  if (value === "없음") {
    return "bg-[#FEE2E2] text-[#991B1B]";
  }

  return "bg-[#F3F4F6] text-[#374151]";
}

export default function AdminFeedbackPage() {
  const [feedbackRows, setFeedbackRows] = useState<FeedbackRow[]>([]);
  const [search, setSearch] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("전체");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadFeedback() {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        if (isMounted) {
          setErrorMessage("서비스 연결 설정을 확인하는 중입니다.");
        }
        return;
      }

      const { data, error } = await supabase
        .from("feedback")
        .select(
          "id, nickname, purpose, satisfaction, liked, pain_point, improvement_idea, reuse_intent, created_at"
        )
        .order("created_at", { ascending: false })
        .returns<FeedbackRow[]>();

      if (!isMounted) {
        return;
      }

      if (error) {
        setErrorMessage(getFriendlyErrorMessage(error.message));
        return;
      }

      setFeedbackRows(data || []);
    }

    void loadFeedback();

    return () => {
      isMounted = false;
    };
  }, []);

  const purposeOptions = useMemo(
    () => ["전체", ...Array.from(new Set(feedbackRows.map((row) => row.purpose)))],
    [feedbackRows]
  );

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return feedbackRows.filter((row) => {
      const matchesPurpose =
        purposeFilter === "전체" || row.purpose === purposeFilter;
      const matchesSearch =
        keyword.length === 0 ||
        row.nickname.toLowerCase().includes(keyword) ||
        row.liked.toLowerCase().includes(keyword) ||
        row.pain_point.toLowerCase().includes(keyword) ||
        row.improvement_idea.toLowerCase().includes(keyword);

      return matchesPurpose && matchesSearch;
    });
  }, [feedbackRows, purposeFilter, search]);

  const averageSatisfaction =
    feedbackRows.length > 0
      ? feedbackRows.reduce((sum, row) => sum + row.satisfaction, 0) /
        feedbackRows.length
      : 0;
  const reuseYesCount = feedbackRows.filter(
    (row) => row.reuse_intent === "있음"
  ).length;

  return (
    <main className="min-h-screen bg-[#F5F1E8] px-4 py-6 text-[#111111] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
            Feedback Management
          </p>
          <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
            <div>
              <h1 className="text-4xl font-black text-[#111111]">
                베타 피드백 관리
              </h1>
              <p className="mt-3 text-sm font-bold leading-6 text-[#374151]">
                베타 사용자가 남긴 만족도, 불편한 점, 개선 아이디어를 확인합니다.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <MetricCard label="전체" value={`${feedbackRows.length}`} />
              <MetricCard
                label="평균"
                value={averageSatisfaction ? averageSatisfaction.toFixed(1) : "0.0"}
              />
              <MetricCard label="재사용" value={`${reuseYesCount}`} />
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="닉네임, 불편한 점, 개선 아이디어 검색"
              className="min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
            />
            <select
              value={purposeFilter}
              onChange={(event) => setPurposeFilter(event.target.value)}
              className="min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none focus:border-[#111111]"
            >
              {purposeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </section>

        {errorMessage ? (
          <section className="mt-5 rounded-[8px] bg-[#FEE2E2] p-5 text-sm font-bold text-[#9B1C1C]">
            {errorMessage}
          </section>
        ) : null}

        <section className="mt-5 grid gap-4">
          {filteredRows.length === 0 ? (
            <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-8 text-center text-sm font-black text-[#374151]">
              확인할 피드백이 없습니다.
            </div>
          ) : (
            filteredRows.map((feedback) => (
              <article
                key={feedback.id}
                className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black text-[#111111]">
                        {feedback.nickname}
                      </h2>
                      <span className="rounded-full bg-[#FFF1EC] px-3 py-1 text-xs font-black text-[#D65339]">
                        {feedback.purpose}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${getReuseClassName(
                          feedback.reuse_intent
                        )}`}
                      >
                        재사용 {feedback.reuse_intent}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-black">
                      <Stars value={feedback.satisfaction} />
                    </p>
                    <p className="mt-4 text-sm font-bold text-[#4B5563]">
                      {formatDate(feedback.created_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-3">
                  <FeedbackBlock title="좋았던 점" content={feedback.liked} />
                  <FeedbackBlock
                    title="불편한 점"
                    content={feedback.pain_point}
                  />
                  <FeedbackBlock
                    title="개선 아이디어"
                    content={feedback.improvement_idea}
                  />
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-[#FBFAF7] p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#374151]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-[#111111]">{value}</p>
    </div>
  );
}

function FeedbackBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-[8px] bg-[#FBFAF7] p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0F5132]">
        {title}
      </p>
      <p className="mt-3 text-sm font-bold leading-7 text-[#111111]">
        {content}
      </p>
    </div>
  );
}
