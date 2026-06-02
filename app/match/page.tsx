"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { trackAnalyticsEvent } from "@/app/analytics";

type RecommendedExpert = {
  id: number;
  name: string;
  category: string;
  profession: string;
  score: number;
  distance: string;
  photoUrl: string;
  reason: string;
};

const report = {
  goal: "체형교정과 통증 없는 운동 루틴 만들기",
  currentState:
    "운동 경험이 많지 않고, 장시간 앉아 있는 생활 패턴으로 어깨와 골반 불균형이 반복되는 상태입니다.",
  analysis:
    "현재 목표가 체형교정이며 운동 경험이 적기 때문에, 강도 높은 퍼포먼스 트레이닝보다 재활 경험이 많고 자세 평가를 기반으로 단계별 루틴을 설계하는 전문가가 적합합니다.",
  recommendationReason:
    "초기에는 관절 가동성, 코어 안정성, 생활 자세 교정이 핵심입니다. 따라서 재활 기반 운동 지도 경험과 상담형 코칭 역량을 함께 가진 전문가를 우선 추천합니다.",
};

const recommendedExperts: RecommendedExpert[] = [
  {
    id: 101,
    name: "Mina Park",
    category: "운동/재활",
    profession: "재활 기반 스트렝스 코치",
    score: 92,
    distance: "340m",
    photoUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&q=80",
    reason:
      "자세 평가와 기초 근력 회복을 함께 진행해 운동 경험이 적은 사용자에게 가장 안정적인 시작점을 제공합니다.",
  },
  {
    id: 108,
    name: "Alex Moon",
    category: "운동/재활",
    profession: "필라테스 재활 트레이너",
    score: 87,
    distance: "4.8km",
    photoUrl:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=240&q=80",
    reason:
      "호흡, 코어, 골반 정렬을 중심으로 무리 없는 루틴을 설계할 수 있어 체형교정 목표와 잘 맞습니다.",
  },
  {
    id: 109,
    name: "Harin Baek",
    category: "심리상담",
    profession: "심리 상담사",
    score: 81,
    distance: "1.8km",
    photoUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80",
    reason:
      "운동 습관 형성이 어려운 배경을 함께 점검하고 지속 가능한 행동 계획을 세우는 데 도움을 줄 수 있습니다.",
  },
];

function ScoreRing({ score }: { score: number }) {
  return (
    <div
      className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(#111111 ${score * 3.6}deg, #ebe7df 0deg)`,
      }}
      aria-label={`추천 점수 ${score}점`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
        <span className="text-xl font-black text-[#111111]">{score}</span>
      </div>
    </div>
  );
}

export default function MatchPage() {
  const [downloadState, setDownloadState] = useState("PDF 다운로드");
  const trackedRef = useRef(false);
  const generatedAt = useMemo(
    () =>
      new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date()),
    []
  );

  useEffect(() => {
    if (trackedRef.current) {
      return;
    }

    trackedRef.current = true;

    void trackAnalyticsEvent({
      eventName: "ai_match_started",
      page: "/match",
      metadata: {
        goal: report.goal,
      },
    });

    void trackAnalyticsEvent({
      eventName: "ai_match_completed",
      page: "/match",
      metadata: {
        top_score: recommendedExperts[0]?.score ?? null,
        top_expert: recommendedExperts[0]?.name ?? null,
        category: recommendedExperts[0]?.category ?? null,
      },
    });
  }, []);

  function handlePdfDownload() {
    setDownloadState("준비 완료");
    window.alert("PDF 다운로드는 곧 제공될 예정입니다.");
  }

  return (
    <main className="min-h-screen bg-[#f5f3ee] text-[#111111]">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-lg font-black tracking-[0.18em] text-[#111111]"
          >
            TRUPICK
          </Link>
          <Link
            href="/experts"
            className="rounded-full border border-[#ded8ce] bg-white px-4 py-2 text-sm font-black text-[#36332f] shadow-sm transition hover:border-[#111111]"
          >
            전문가 탐색
          </Link>
        </header>

        <section className="pt-10 sm:pt-14">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#8a8073]">
                AI matching report
              </p>
              <h1 className="mt-3 max-w-4xl text-[clamp(2.55rem,8vw,5.7rem)] font-black leading-[0.92] tracking-normal">
                나에게 맞는 전문가 추천 리포트
              </h1>
            </div>

            <div className="rounded-[8px] border border-[#ddd7cd] bg-white/88 p-5 shadow-[0_18px_60px_rgba(30,28,24,0.08)] backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a8073]">
                Report date
              </p>
              <p className="mt-2 text-lg font-black">{generatedAt}</p>
              <button
                type="button"
                onClick={handlePdfDownload}
                className="mt-4 w-full rounded-full bg-[#111111] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0f3d2e]"
              >
                {downloadState}
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[8px] border border-[#ddd7cd] bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a8073]">
              사용자의 목표
            </p>
            <p className="mt-3 text-xl font-black leading-7">{report.goal}</p>
          </div>
          <div className="rounded-[8px] border border-[#ddd7cd] bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a8073]">
              현재 상태 요약
            </p>
            <p className="mt-3 text-sm font-bold leading-7 text-[#514c45]">
              {report.currentState}
            </p>
          </div>
          <div className="rounded-[8px] border border-[#ddd7cd] bg-[#111111] p-5 text-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-white/58">
              Match confidence
            </p>
            <p className="mt-3 text-5xl font-black">92%</p>
            <p className="mt-2 text-sm font-bold leading-6 text-white/72">
              목표와 전문가 경험의 일치도가 높습니다.
            </p>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[8px] border border-[#ddd7cd] bg-white p-6 shadow-[0_22px_70px_rgba(30,28,24,0.08)] sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a8073]">
              AI 분석 결과
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-normal">
              지금은 강도보다 정확도가 먼저입니다.
            </h2>
            <p className="mt-5 text-base font-bold leading-8 text-[#514c45]">
              {report.analysis}
            </p>
            <div className="mt-6 rounded-[8px] bg-[#f6f3ec] p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a8073]">
                추천 이유
              </p>
              <p className="mt-3 text-lg font-black leading-8">
                {report.recommendationReason}
              </p>
            </div>
          </div>

          <div className="rounded-[8px] border border-[#ddd7cd] bg-white p-4 shadow-[0_22px_70px_rgba(30,28,24,0.08)] sm:p-5">
            <div className="mb-4 flex items-end justify-between gap-4 px-1">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a8073]">
                  Top 3 experts
                </p>
                <h2 className="mt-2 text-2xl font-black">적합한 전문가 TOP3</h2>
              </div>
              <span className="rounded-full bg-[#f6f3ec] px-3 py-2 text-xs font-black text-[#514c45]">
                AI 추천
              </span>
            </div>

            <div className="grid gap-3">
              {recommendedExperts.map((expert, index) => (
                <article
                  key={expert.id}
                  className="grid gap-4 rounded-[8px] border border-[#e5dfd5] bg-[#fbfaf7] p-4 sm:grid-cols-[96px_minmax(0,1fr)_80px] sm:items-center"
                >
                  <div className="relative h-24 w-24 overflow-hidden rounded-[8px] bg-[#ebe7df]">
                    <Image
                      src={expert.photoUrl}
                      alt={expert.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#111111]">
                        TOP {index + 1}
                      </span>
                      <span className="rounded-full bg-[#fff1ec] px-3 py-1 text-xs font-black text-[#d65339]">
                        {expert.category}
                      </span>
                    </div>
                    <h3 className="mt-3 text-xl font-black">{expert.name}</h3>
                    <p className="mt-1 text-sm font-black text-[#514c45]">
                      {expert.profession} · {expert.distance}
                    </p>
                    <p className="mt-3 text-sm font-bold leading-6 text-[#6a645b]">
                      {expert.reason}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:block">
                    <ScoreRing score={expert.score} />
                    <p className="text-sm font-black text-[#111111] sm:mt-2 sm:text-center">
                      {expert.score}점
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[8px] border border-[#ddd7cd] bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a8073]">
                Next step
              </p>
              <h2 className="mt-2 text-2xl font-black">
                추천 리포트를 바탕으로 상담을 시작해보세요.
              </h2>
              <p className="mt-2 text-sm font-bold leading-6 text-[#6a645b]">
                상세 상담 전, 목표와 현재 상태를 전문가에게 공유하면 첫 상담의
                밀도가 높아집니다.
              </p>
            </div>
            <Link
              href="/request"
              className="rounded-full bg-[#0f3d2e] px-6 py-4 text-center text-sm font-black text-white transition hover:bg-[#111111]"
            >
              상담 요청하기
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
