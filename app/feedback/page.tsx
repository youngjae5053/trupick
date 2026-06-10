"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { trackAnalyticsEvent } from "@/app/analytics";
import { getFriendlyErrorMessage } from "@/app/errorMessages";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

const purposeOptions = [
  "전문가 찾기",
  "전문가 등록",
  "AI 매칭",
  "상담 신청",
  "기타",
];

const reuseOptions = ["있음", "없음", "모르겠음"];

export default function FeedbackPage() {
  const [nickname, setNickname] = useState("");
  const [purpose, setPurpose] = useState("전문가 찾기");
  const [satisfaction, setSatisfaction] = useState(5);
  const [liked, setLiked] = useState("");
  const [painPoint, setPainPoint] = useState("");
  const [improvementIdea, setImprovementIdea] = useState("");
  const [reuseIntent, setReuseIntent] = useState("있음");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (
      !nickname.trim() ||
      !liked.trim() ||
      !painPoint.trim() ||
      !improvementIdea.trim()
    ) {
      setErrorMessage("모든 필수 항목을 입력해주세요.");
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      console.error("Supabase browser client is not available on /feedback.");
      setErrorMessage("피드백을 저장할 수 없습니다. Supabase 환경변수를 확인해주세요.");
      return;
    }

    setSubmitting(true);

    const { data: userData } = await supabase.auth.getUser();
    const payload = {
      user_id: userData.user?.id ?? null,
      nickname: nickname.trim(),
      purpose,
      satisfaction,
      liked: liked.trim(),
      pain_point: painPoint.trim(),
      improvement_idea: improvementIdea.trim(),
      reuse_intent: reuseIntent,
    };
    const { error } = await supabase.from("feedback").insert([payload]);

    setSubmitting(false);

    if (error) {
      console.error("Failed to submit feedback", error);
      setErrorMessage(getFriendlyErrorMessage(error.message));
      return;
    }

    await trackAnalyticsEvent({
      eventName: "feedback_submitted",
      page: "/feedback",
      metadata: {
        purpose,
        satisfaction,
        reuse_intent: reuseIntent,
      },
    });

    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-[#F5F1E8] px-4 py-6 text-[#111111] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-[0.16em] text-[#111111]"
          >
            TRUPICK
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/beta"
              className="rounded-full border border-[#D9CFBF] bg-white px-4 py-2 text-sm font-black text-[#0F5132] transition hover:border-[#111111]"
            >
              베타 페이지
            </Link>
            <Link
              href="/experts"
              className="rounded-full bg-[#0F5132] px-4 py-2 text-sm font-black text-white transition hover:bg-[#146C43]"
            >
              전문가 둘러보기
            </Link>
          </div>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8">
            {submitted ? (
              <div className="py-14 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0F5132] text-2xl font-black text-white">
                  ✓
                </div>
                <h1 className="mt-6 text-4xl font-black text-[#111111]">
                  피드백이 접수되었습니다.
                </h1>
                <p className="mx-auto mt-4 max-w-md text-sm font-bold leading-7 text-[#374151]">
                  TRUPICK 개선에 큰 도움이 됩니다.
                </p>
                <Link
                  href="/beta"
                  className="mt-7 inline-flex rounded-full bg-[#0F5132] px-6 py-3 text-sm font-black text-white transition hover:bg-[#146C43]"
                >
                  베타 페이지로 돌아가기
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
                  Beta Feedback
                </p>
                <h1 className="mt-3 text-4xl font-black text-[#111111] sm:text-5xl">
                  TRUPICK 사용 경험을 들려주세요
                </h1>
                <p className="mt-4 text-sm font-bold leading-7 text-[#374151]">
                  좋았던 점과 불편했던 점을 구체적으로 남겨주시면 베타 개선
                  우선순위를 정하는 데 큰 도움이 됩니다.
                </p>

                <form onSubmit={submitFeedback} className="mt-7 grid gap-5">
                  <label className="grid gap-2">
                    <span className="text-sm font-black text-[#111111]">
                      이름 또는 닉네임
                    </span>
                    <input
                      value={nickname}
                      onChange={(event) => setNickname(event.target.value)}
                      placeholder="예: 김서연"
                      className="min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
                    />
                  </label>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-black text-[#111111]">
                        사용 목적
                      </span>
                      <select
                        value={purpose}
                        onChange={(event) => setPurpose(event.target.value)}
                        className="min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none focus:border-[#111111]"
                      >
                        {purposeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-black text-[#111111]">
                        다시 사용할 의향
                      </span>
                      <select
                        value={reuseIntent}
                        onChange={(event) => setReuseIntent(event.target.value)}
                        className="min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none focus:border-[#111111]"
                      >
                        {reuseOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div>
                    <p className="text-sm font-black text-[#111111]">만족도</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setSatisfaction(score)}
                          className={`h-11 w-11 rounded-full text-lg font-black transition ${
                            score <= satisfaction
                              ? "bg-[#0F5132] text-white"
                              : "border border-[#D9CFBF] bg-white text-[#9CA3AF]"
                          }`}
                          aria-label={`만족도 ${score}점`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <FeedbackTextarea
                    label="가장 좋았던 점"
                    value={liked}
                    onChange={setLiked}
                    placeholder="예: 전문가 상세페이지에서 자격증과 경력을 한눈에 볼 수 있어서 좋았습니다."
                  />
                  <FeedbackTextarea
                    label="가장 불편했던 점"
                    value={painPoint}
                    onChange={setPainPoint}
                    placeholder="예: 카테고리 선택 후 어떤 전문가를 먼저 봐야 할지 조금 헷갈렸습니다."
                  />
                  <FeedbackTextarea
                    label="개선 아이디어"
                    value={improvementIdea}
                    onChange={setImprovementIdea}
                    placeholder="예: 상담 가능 시간이나 가격대가 카드에서 바로 보이면 좋겠습니다."
                  />

                  {errorMessage ? (
                    <p className="rounded-[8px] bg-[#FEE2E2] p-4 text-sm font-bold text-[#9B1C1C]">
                      {errorMessage}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-[#0F5132] px-6 py-4 text-sm font-black text-white transition hover:bg-[#146C43] disabled:opacity-70"
                  >
                    {submitting ? "제출 중..." : "피드백 제출"}
                  </button>
                </form>
              </>
            )}
          </div>

          <aside className="grid gap-4">
            {[
              ["왜 필요한가요?", "베타 사용자의 실제 흐름을 기준으로 개선 우선순위를 정합니다."],
              ["무엇을 보면 좋나요?", "전문가 탐색, AI 매칭, 상담 신청 중 어디서 막혔는지 알려주세요."],
              ["어떻게 쓰이나요?", "남겨주신 의견은 운영자 페이지에서 확인하고 다음 배포에 반영합니다."],
            ].map(([title, description]) => (
              <div
                key={title}
                className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-sm"
              >
                <h2 className="text-xl font-black text-[#111111]">{title}</h2>
                <p className="mt-3 text-sm font-bold leading-6 text-[#374151]">
                  {description}
                </p>
              </div>
            ))}
          </aside>
        </section>
      </div>
    </main>
  );
}

function FeedbackTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#111111]">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        placeholder={placeholder}
        className="min-h-32 w-full resize-y rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 py-3 text-sm font-bold leading-7 text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
      />
    </label>
  );
}
