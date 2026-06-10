import Link from "next/link";
import AuthNav from "@/app/components/AuthNav";

const whyCards = [
  {
    title: "검증된 전문가만 노출",
    description:
      "TRUPICK은 프로필, 경력, 자격, 사례를 함께 검토해 고객이 신뢰할 수 있는 전문가만 소개합니다.",
  },
  {
    title: "신뢰 기반 연결",
    description:
      "저가 견적 경쟁보다 고객의 목표, 문제, 상황에 맞는 전문성을 더 잘 보여주는 연결을 지향합니다.",
  },
  {
    title: "전문성 표현",
    description:
      "프로필, 대표 사례, 인터뷰 기반 콘텐츠로 전문가의 철학과 해결 방식을 선명하게 전달합니다.",
  },
];

const processSteps = [
  ["Step 1", "프로필 작성"],
  ["Step 2", "자격/경력 제출"],
  ["Step 3", "TRUPICK 검토"],
  ["Step 4", "승인 후 노출"],
  ["Step 5", "상담 요청 수신"],
];

const recommendedExperts = [
  "재활운동 전문가",
  "퍼스널트레이너",
  "필라테스 강사",
  "러닝 코치",
  "체형교정 전문가",
  "시니어 운동 지도자",
];

const faqs = [
  {
    question: "자격증이 꼭 있어야 하나요?",
    answer:
      "분야에 따라 다릅니다. 자격증은 중요한 검증 요소지만, 실제 지도 사례, 경력, 고객 응대 방식도 함께 검토합니다.",
  },
  {
    question: "승인까지 얼마나 걸리나요?",
    answer:
      "베타 기간에는 제출된 정보의 완성도에 따라 순차적으로 검토합니다. 보완이 필요한 경우 추가 안내를 드릴 수 있습니다.",
  },
  {
    question: "비용이 있나요?",
    answer:
      "Free Plan으로 기본 프로필 등록과 상담 요청 수신을 시작할 수 있습니다. Premium Plan은 우선 노출과 추천 강화 기능을 제공합니다.",
  },
  {
    question: "상담 요청은 어떻게 받나요?",
    answer:
      "승인 후 전문가 목록과 상세 프로필에 노출되며, 고객이 상담 요청을 보내면 마이페이지와 상담 관리 화면에서 확인할 수 있습니다.",
  },
];

export default function BecomeExpertPage() {
  return (
    <main className="min-h-screen bg-[#F5F1E8] text-[#111111]">
      <header className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:flex-nowrap sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-2xl font-extrabold tracking-[0.16em] text-[#111111]"
        >
          TRUPICK
        </Link>
        <AuthNav />
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8 lg:py-24">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[#0F5132]">
            Become a Verified Expert
          </p>
          <h1 className="mt-5 max-w-4xl text-[clamp(2.6rem,7vw,5.2rem)] font-black leading-[1.02] tracking-[-0.035em] text-[#111111]">
            <span className="block">검증된 운동 전문가로</span>
            <span className="block">소개되세요.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg font-bold leading-8 text-[#374151] sm:text-xl">
            TRUPICK은 아무나 노출하지 않습니다. 전문성과 사례를 가진
            전문가가 더 잘 보이도록 돕습니다.
          </p>
          <Link
            href="/register"
            className="mt-10 inline-flex rounded-full bg-[#0F5132] px-8 py-4 text-base font-black text-white shadow-[0_18px_50px_rgba(15,81,50,0.22)] transition hover:bg-[#146C43]"
          >
            전문가 등록 시작하기
          </Link>
          <Link
            href="/invite-expert"
            className="ml-0 mt-3 inline-flex rounded-full border border-[#111111] bg-white px-8 py-4 text-base font-black text-[#111111] shadow-sm transition hover:-translate-y-0.5 sm:ml-3"
          >
            베타 전문가 신청하기
          </Link>
        </div>

        <aside className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_28px_90px_rgba(24,24,20,0.10)] lg:mt-10">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
            For Beta Experts
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.03em]">
            운동/재활 전문가 중심으로 운영됩니다.
          </h2>
          <p className="mt-4 text-sm font-bold leading-7 text-[#374151]">
            재활운동, 통증관리, 체형교정, 근력향상, 필라테스, 러닝 등 고객의 몸과
            생활에 직접 영향을 주는 영역을 우선 검증합니다.
          </p>
        </aside>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-[#0F5132]">
          Why TRUPICK
        </p>
        <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] sm:text-5xl">
          전문가답게 발견되는 방식
        </h2>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {whyCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm"
            >
              <h3 className="text-2xl font-black">{card.title}</h3>
              <p className="mt-4 text-sm font-bold leading-7 text-[#374151]">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8 lg:p-10">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#0F5132]">
            Registration Process
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] sm:text-5xl">
            등록부터 상담 요청까지
          </h2>
          <div className="mt-8 grid gap-3 md:grid-cols-5">
            {processSteps.map(([step, title]) => (
              <div key={step} className="rounded-[8px] bg-[#FBFAF7] p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0F5132]">
                  {step}
                </p>
                <h3 className="mt-5 text-xl font-black">{title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#0F5132]">
            Recommended For
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] sm:text-5xl">
            이런 전문가에게 추천합니다.
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {recommendedExperts.map((item) => (
            <div
              key={item}
              className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 text-lg font-black shadow-sm"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#0F5132]">
              Free
            </p>
            <h3 className="mt-3 text-3xl font-black">기본 노출로 시작</h3>
            <p className="mt-4 text-sm font-bold leading-7 text-[#374151]">
              프로필 등록, 검증 신청, 상담 요청 수신, 리뷰 관리가 가능합니다.
            </p>
          </article>
          <article className="rounded-[8px] border border-[#111111] bg-[#111111] p-6 text-white shadow-[0_24px_80px_rgba(24,24,20,0.14)] sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#B7E3C9]">
              Premium
            </p>
            <h3 className="mt-3 text-3xl font-black">더 잘 보이는 전문가</h3>
            <p className="mt-4 text-sm font-bold leading-7 text-white/80">
              상단 우선 노출, Premium Expert 배지, AI 매칭 우선 추천으로 더 많은
              상담 기회를 만들 수 있습니다.
            </p>
            <Link
              href="/pricing"
              className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-black text-[#111111]"
            >
              자세히 보기
            </Link>
          </article>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-[#0F5132]">
          FAQ
        </p>
        <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] sm:text-5xl">
          자주 묻는 질문
        </h2>
        <div className="mt-8 grid gap-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-sm"
            >
              <summary className="cursor-pointer text-lg font-black text-[#111111]">
                {faq.question}
              </summary>
              <p className="mt-4 text-sm font-bold leading-7 text-[#374151]">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[8px] bg-[#0F5132] p-8 text-white shadow-[0_28px_90px_rgba(15,81,50,0.20)] sm:p-12">
          <h2 className="max-w-3xl text-4xl font-black tracking-[-0.03em] sm:text-6xl">
            검증 전문가로 등록하기
          </h2>
          <p className="mt-5 max-w-2xl text-base font-bold leading-8 text-white/85">
            전문성과 사례가 있다면 TRUPICK에서 더 신뢰감 있게 소개될 수
            있습니다.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex rounded-full bg-white px-8 py-4 text-base font-black text-[#0F5132]"
          >
            전문가 등록 시작하기
          </Link>
          <Link
            href="/invite-expert"
            className="ml-0 mt-3 inline-flex rounded-full border border-white/40 px-8 py-4 text-base font-black text-white sm:ml-3"
          >
            베타 전문가 신청하기
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#E5E7EB] bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p className="text-lg font-black tracking-[0.16em] text-[#111111]">
            TRUPICK
          </p>
          <nav className="flex flex-wrap gap-4 text-sm font-black text-[#111111]">
            <Link href="/experts">Experts</Link>
            <Link href="/become-expert">Become Expert</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/how-we-verify">Verification</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
