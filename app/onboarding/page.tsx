import Link from "next/link";

const onboardingSteps = [
  {
    step: "STEP 1",
    title: "검증된 전문가를 찾는 플랫폼",
    description: "TRUPICK은 검증된 전문가를 찾는 플랫폼입니다.",
  },
  {
    step: "STEP 2",
    title: "나에게 맞는 기준으로 탐색",
    description:
      "카테고리, 거리, 후기, AI 추천으로 나에게 맞는 전문가를 찾을 수 있습니다.",
  },
  {
    step: "STEP 3",
    title: "프로필 확인 후 상담 요청",
    description:
      "전문가 프로필을 확인하고 상담 요청을 보낼 수 있습니다.",
  },
];

export default function OnboardingPage() {
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
          className="rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-black text-[#111111] shadow-sm transition hover:border-[#111111]"
        >
          Skip
        </Link>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pb-20 lg:pt-14">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#0F5132]">
            New to TRUPICK?
          </p>
          <h1 className="mt-4 text-[44px] font-black leading-[1.02] tracking-normal text-[#111111] sm:text-[56px]">
            처음 방문해도 바로 전문가를 찾을 수 있게.
          </h1>
          <p className="mt-6 max-w-2xl text-base font-bold leading-8 text-[#4B5563] sm:text-lg">
            TRUPICK은 복잡한 검색 과정을 줄이고, 필요한 분야의 검증 전문가를
            빠르게 비교할 수 있도록 설계된 전문가 탐색 서비스입니다.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {onboardingSteps.map((item) => (
            <article
              key={item.step}
              className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#D65339]">
                {item.step}
              </p>
              <h2 className="mt-5 text-2xl font-black leading-tight text-[#111111]">
                {item.title}
              </h2>
              <p className="mt-4 text-sm font-bold leading-7 text-[#4B5563]">
                {item.description}
              </p>
            </article>
          ))}
        </div>

        <section className="mt-6 rounded-[8px] border border-[#E5E7EB] bg-[#111111] p-6 text-white shadow-[0_24px_80px_rgba(24,24,20,0.12)] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/55">
                Ready
              </p>
              <h2 className="mt-2 text-3xl font-black">
                지금 바로 나에게 맞는 전문가를 찾아보세요.
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/experts"
                className="rounded-full bg-[#0F5132] px-6 py-4 text-center text-sm font-black text-white transition hover:bg-[#146C43]"
              >
                전문가 찾기
              </Link>
              <Link
                href="/match"
                className="rounded-full bg-white px-6 py-4 text-center text-sm font-black text-[#111111] transition hover:bg-[#F5F1E8]"
              >
                AI 매칭 시작하기
              </Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
