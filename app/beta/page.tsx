import Link from "next/link";
import BetaSharePanel from "@/app/components/BetaSharePanel";

const summaries = [
  "TRUPICK은 검증된 전문가를 거리와 카테고리 기준으로 찾는 서비스입니다.",
  "전문가 프로필, 평점, 후기, AI 추천 리포트를 통해 선택을 쉽게 만듭니다.",
  "베타 기간에는 탐색과 상담 요청 흐름을 체험하고 피드백을 남길 수 있습니다.",
];

const steps = [
  "전문가 찾기",
  "프로필 보기",
  "상담 요청 체험",
  "피드백 남기기",
];

export default function BetaPage() {
  return (
    <main className="min-h-screen bg-[#F5F1E8] text-[#111111]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-xl font-extrabold tracking-[0.16em] text-[#111111]"
        >
          TRUPICK
        </Link>
        <Link
          href="/experts"
          className="rounded-full bg-[#111111] px-4 py-2 text-sm font-black text-white"
        >
          전문가 찾기
        </Link>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 pb-14 pt-6 sm:px-6 lg:px-8 lg:pb-20 lg:pt-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#D65339]">
              Beta Test
            </p>
            <h1 className="mt-4 max-w-3xl text-[44px] font-black leading-[1.02] tracking-normal text-[#111111] sm:text-[60px]">
              TRUPICK 베타 테스트에 참여해주세요.
            </h1>
            <p className="mt-6 max-w-2xl text-base font-bold leading-8 text-[#4B5563] sm:text-lg">
              초기 사용자와 함께 전문가 탐색 경험을 다듬고 있습니다. 실제 사용
              흐름을 체험하고, 더 좋은 서비스가 될 수 있도록 의견을 남겨주세요.
            </p>

            <div className="mt-8 grid gap-3">
              {summaries.map((summary) => (
                <div
                  key={summary}
                  className="rounded-[8px] border border-[#E5E7EB] bg-white p-4 text-sm font-bold leading-7 text-[#111111] shadow-sm"
                >
                  {summary}
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-[0_20px_65px_rgba(24,24,20,0.10)] lg:sticky lg:top-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0F5132]">
              Join Beta
            </p>
            <h2 className="mt-3 text-2xl font-black">베타 참여 안내</h2>
            <p className="mt-3 text-sm font-bold leading-7 text-[#4B5563]">
              10분 정도만 투자해도 탐색, 프로필, 상담 요청 흐름을 모두 확인할 수
              있습니다.
            </p>
            <div className="mt-5 grid gap-2">
              <Link
                href="/experts"
                className="rounded-full bg-[#0F5132] px-5 py-4 text-center text-sm font-black text-white transition hover:bg-[#146C43]"
              >
                베타 참여하기
              </Link>
              <Link
                href="#feedback"
                className="rounded-full border border-[#E5E7EB] bg-white px-5 py-4 text-center text-sm font-black text-[#111111] transition hover:border-[#111111]"
              >
                피드백 페이지로 이동
              </Link>
            </div>
          </aside>
        </div>

        <section className="mt-10">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
            How to try
          </p>
          <h2 className="mt-3 text-3xl font-black">체험 방법</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <article
                key={step}
                className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-black text-[#8a8073]">
                  STEP {index + 1}
                </p>
                <h3 className="mt-4 text-xl font-black">{step}</h3>
              </article>
            ))}
          </div>
        </section>

        <BetaSharePanel />

        <section
          id="feedback"
          className="sticky bottom-3 mt-8 rounded-[8px] border border-[#E5E7EB] bg-[#111111] p-5 text-white shadow-[0_24px_80px_rgba(24,24,20,0.18)] sm:p-7"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/55">
                Feedback
              </p>
              <h2 className="mt-2 text-3xl font-black">체험 후 의견을 남겨주세요.</h2>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-white/70">
                좋았던 점, 헷갈렸던 점, 추가되면 좋을 기능을 알려주시면 베타
                개선에 반영하겠습니다.
              </p>
            </div>
            <Link
              href="/feedback"
              className="rounded-full bg-white px-6 py-4 text-center text-sm font-black text-[#111111] transition hover:bg-[#F5F1E8]"
            >
              피드백 남기기
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
