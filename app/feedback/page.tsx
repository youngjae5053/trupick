"use client";

import Link from "next/link";
import { useState } from "react";
import { trackAnalyticsEvent } from "@/app/analytics";

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function submitFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await trackAnalyticsEvent({
      eventName: "feedback_submitted",
      page: "/feedback",
      metadata: {
        name: name || null,
        message,
      },
    });

    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-[#F5F1E8] px-4 py-6 text-[#111111] sm:px-6 lg:px-10">
      <section className="mx-auto max-w-2xl rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
        <Link
          href="/beta"
          className="text-sm font-black text-[#0F5132] underline underline-offset-4"
        >
          베타 페이지로
        </Link>
        {submitted ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0F5132] text-xl font-black text-white">
              ✓
            </div>
            <h1 className="mt-5 text-4xl font-black">피드백이 접수되었습니다</h1>
            <p className="mt-4 text-sm font-bold leading-7 text-[#4B5563]">
              남겨주신 의견은 베타 개선에 반영하겠습니다.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
              Beta Feedback
            </p>
            <h1 className="mt-3 text-4xl font-black">TRUPICK 사용 의견 남기기</h1>
            <p className="mt-3 text-sm font-bold leading-7 text-[#4B5563]">
              좋았던 점, 헷갈렸던 점, 추가되면 좋을 기능을 편하게 남겨주세요.
            </p>
            <form onSubmit={submitFeedback} className="mt-6 grid gap-4">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="이름 또는 닉네임"
                className="min-h-12 rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] px-4 text-sm font-bold outline-none focus:border-[#111111]"
              />
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
                placeholder="피드백을 입력해주세요"
                className="min-h-40 rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] px-4 py-3 text-sm font-bold leading-7 outline-none focus:border-[#111111]"
              />
              <button
                type="submit"
                className="rounded-full bg-[#0F5132] px-6 py-4 text-sm font-black text-white transition hover:bg-[#146C43]"
              >
                피드백 제출
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
