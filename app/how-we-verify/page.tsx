import Link from "next/link";
import AuthNav from "@/app/components/AuthNav";
import VerificationFaqAccordion from "@/app/components/VerificationFaqAccordion";

const concernCards = [
  {
    title: "정보 비대칭",
    description: "고객은 전문가의 실력을 쉽게 판단하기 어렵습니다.",
  },
  {
    title: "결과 책임",
    description:
      "잘못된 선택은 시간, 비용, 건강, 법적 리스크로 이어질 수 있습니다.",
  },
  {
    title: "신뢰 기반 선택",
    description:
      "리뷰만으로는 부족합니다. 검증된 정보와 실제 사례가 함께 필요합니다.",
  },
];

const verificationSteps = [
  {
    step: "Step 1",
    label: "Identity Check",
    title: "신원 확인",
    description: "전문가 본인 여부와 기본 정보를 확인합니다.",
  },
  {
    step: "Step 2",
    label: "Career Review",
    title: "경력 검토",
    description:
      "제출된 경력, 활동 이력, 전문 분야의 일관성을 검토합니다.",
  },
  {
    step: "Step 3",
    label: "Qualification Check",
    title: "자격 및 증빙 확인",
    description:
      "자격증, 포트폴리오, 사업자 정보, 관련 활동 자료를 확인합니다. 단, 분야별로 필요한 자격 기준은 다를 수 있습니다.",
  },
  {
    step: "Step 4",
    label: "Expert Interview",
    title: "전문가 인터뷰",
    description:
      "전문가의 문제 해결 방식, 고객 응대 태도, 전문 철학을 확인합니다.",
  },
  {
    step: "Step 5",
    label: "Case & Review Screening",
    title: "사례 및 후기 검토",
    description:
      "실제 사례, 고객 후기, 응답률, 상담 품질을 종합적으로 검토합니다.",
  },
];

const categoryStandards = [
  {
    title: "운동/재활",
    items: ["자격증 및 경력", "지도 사례", "부상 예방 및 안전 인식", "상담/지도 철학"],
  },
  {
    title: "세무",
    items: [
      "세무 관련 자격 및 경력",
      "신고/절세 상담 경험",
      "사업자·프리랜서 케이스 이해도",
      "법적 리스크 설명 능력",
    ],
  },
  {
    title: "법률",
    items: ["변호사 자격 및 등록 여부", "상담 분야 전문성", "계약/분쟁 사례", "책임 범위 안내 능력"],
  },
  {
    title: "디자인",
    items: ["포트폴리오 품질", "브랜드/UX 이해도", "작업 프로세스", "커뮤니케이션 방식"],
  },
  {
    title: "마케팅",
    items: ["실제 캠페인 경험", "성과 지표 이해", "채널별 전략 능력", "과장 광고 여부 검토"],
  },
  {
    title: "사진/영상",
    items: ["포트폴리오", "촬영/편집 경험", "장비 및 결과물 품질", "일정/납품 신뢰도"],
  },
  {
    title: "심리/상담",
    items: ["관련 자격 및 교육 이력", "상담 윤리", "개인정보 보호 의식", "상담 범위 안내 능력"],
  },
];

const scoreItems = [
  ["신원 확인", "10점"],
  ["경력 검토", "20점"],
  ["자격/증빙 확인", "20점"],
  ["인터뷰 검증", "20점"],
  ["사례/후기 검토", "20점"],
  ["응답 품질", "10점"],
];

const badgeItems = [
  {
    title: "VERIFIED",
    description: "TRUPICK 기본 검증 절차를 통과한 전문가",
  },
  {
    title: "PREMIUM",
    description: "우선 노출 플랜을 사용하는 전문가. 검증과는 별개의 표시입니다.",
  },
  {
    title: "TOP REVIEWED",
    description: "후기가 많고 만족도가 높은 전문가",
  },
  {
    title: "FAST RESPONSE",
    description: "응답률과 응답 속도가 우수한 전문가",
  },
];

const promiseItems = [
  "아무나 전문가로 노출하지 않습니다.",
  "분야별 특성에 맞게 검증합니다.",
  "광고와 검증을 구분합니다.",
  "고객이 비교할 수 있는 정보를 제공합니다.",
];

const faqItems = [
  {
    question: "자격증이 없으면 전문가 등록이 불가능한가요?",
    answer:
      "분야에 따라 다릅니다. 디자인, 마케팅, 사진/영상처럼 포트폴리오와 사례가 더 중요한 분야도 있습니다.",
  },
  {
    question: "Premium 전문가가 더 검증된 전문가인가요?",
    answer:
      "아닙니다. Premium은 노출 플랜이고, Verified는 검증 상태입니다. 두 표시는 분리됩니다.",
  },
  {
    question: "TRUPICK이 모든 결과를 보장하나요?",
    answer:
      "아닙니다. TRUPICK은 검증된 정보를 제공하지만, 실제 결과는 전문가와 고객의 상황에 따라 달라질 수 있습니다.",
  },
  {
    question: "전문가 선별 원칙은 계속 바뀌나요?",
    answer:
      "네. 사용자 피드백, 후기, 상담 품질 데이터를 바탕으로 지속적으로 개선합니다.",
  },
];

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? (
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-3xl font-black leading-tight text-[#111111] sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base font-bold leading-8 text-[#374151] sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export default function HowWeVerifyPage() {
  return (
    <main className="min-h-screen bg-[#F5F1E8] text-[#111111]">
      <header className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:flex-nowrap sm:px-6 lg:px-8">
        <Link href="/" className="text-2xl font-extrabold tracking-[0.16em] text-[#111111]">
          TRUPICK
        </Link>
        <AuthNav />
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 pb-14 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8 lg:pb-24 lg:pt-16">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#0F5132]">
            TRUPICK STANDARDS
          </p>
          <h1 className="mt-5 max-w-4xl text-[clamp(2.6rem,12vw,5.4rem)] font-black leading-[1.02] tracking-normal text-[#111111] sm:tracking-[-0.04em]">
            검증된 전문가를 선별하는 원칙을 만듭니다.
          </h1>
          <p className="mt-6 max-w-3xl whitespace-pre-line text-lg font-bold leading-8 text-[#374151] sm:text-xl sm:leading-9">
            {`TRUPICK은 단순히 프로필을 등록한 전문가를 보여주지 않습니다.
경력, 자격, 전문성, 인터뷰, 실제 사례를 바탕으로
고객이 신뢰할 수 있는 전문가를 선별합니다.`}
          </p>
          <div className="mt-6 rounded-[8px] border border-[#D9CFBF] bg-white p-5 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#0F5132]">
              Beta focus
            </p>
            <p className="mt-2 text-base font-black leading-7 text-[#111111]">
              현재 베타는 운동/재활 전문가를 중심으로 운영됩니다.
            </p>
            <p className="mt-2 text-sm font-bold leading-7 text-[#374151]">
              재활운동, 통증관리, 체형교정, 다이어트, 근력향상 전문가의 선별 원칙을 먼저 고도화한 뒤 다른 분야로 확장할 예정입니다.
            </p>
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/experts"
              className="rounded-full bg-[#0F5132] px-7 py-4 text-center text-base font-black text-white shadow-[0_14px_40px_rgba(15,81,50,0.22)] transition hover:bg-[#146C43]"
            >
              전문가 둘러보기
            </Link>
            <Link
              href="/register"
              className="rounded-full border border-[#D9CFBF] bg-white px-7 py-4 text-center text-base font-black text-[#111111] shadow-sm transition hover:border-[#111111]"
            >
              전문가 등록하기
            </Link>
          </div>
        </div>
        <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_28px_90px_rgba(24,24,20,0.12)] lg:self-end">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
            Verified Score
          </p>
          <div className="mt-6 rounded-[8px] bg-[#111111] p-6 text-white">
            <p className="text-6xl font-black leading-none">93점</p>
            <p className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-xs font-black text-[#111111]">
              TRUPICK VERIFIED
            </p>
          </div>
          <p className="mt-5 text-sm font-bold leading-7 text-[#374151]">
            검증은 광고가 아니라 신뢰 정보를 구조화하는 과정입니다.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader
          title="왜 검증이 필요할까요?"
          description="전문가 서비스는 단순한 상품 구매와 다릅니다. 운동, 세무, 법률, 디자인, 마케팅처럼 고객의 몸, 돈, 시간, 사업에 직접 영향을 주는 분야에서는 전문가의 실력과 태도를 사전에 확인하는 과정이 중요합니다."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {concernCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0F5132] text-sm font-black text-white">
                ✓
              </span>
              <h3 className="mt-5 text-2xl font-black text-[#111111]">
                {card.title}
              </h3>
              <p className="mt-3 text-sm font-bold leading-7 text-[#374151]">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Process" title="TRUPICK 5-Step Verification" />
        <div className="mt-8 grid gap-4 lg:grid-cols-5">
          {verificationSteps.map((item) => (
            <article
              key={item.step}
              className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0F5132]">
                {item.step}. {item.label}
              </p>
              <h3 className="mt-5 text-xl font-black text-[#111111]">
                {item.title}
              </h3>
              <p className="mt-3 text-sm font-bold leading-7 text-[#374151]">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader
          title="분야별로 다르게 검증합니다."
          description="모든 전문가를 같은 기준으로 평가하지 않습니다. 각 분야의 특성에 맞게 필요한 검증 요소를 다르게 봅니다."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categoryStandards.map((category) => (
            <article
              key={category.title}
              className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm transition hover:-translate-y-[4px] hover:shadow-[0_18px_45px_rgba(24,24,20,0.08)]"
            >
              <h3 className="text-2xl font-black text-[#111111]">
                {category.title}
              </h3>
              <ul className="mt-5 grid gap-3">
                {category.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-[8px] bg-[#FBFAF7] px-4 py-3 text-sm font-bold text-[#374151]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
        <div className="rounded-[8px] bg-[#0F5132] p-7 text-white shadow-[0_24px_70px_rgba(15,81,50,0.20)]">
          <p className="text-sm font-black uppercase tracking-[0.18em]">
            TRUPICK Verified Score
          </p>
          <p className="mt-8 text-7xl font-black leading-none">93점</p>
          <p className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-xs font-black text-[#0F5132]">
            TRUPICK VERIFIED
          </p>
        </div>
        <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
          <SectionHeader
            title="검증 요소를 종합해 신뢰 정보를 표시합니다."
            description="Verified Score는 전문가를 절대적으로 순위화하기 위한 점수가 아니라, 고객이 선택에 참고할 수 있도록 검증 정보를 구조화한 지표입니다."
          />
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {scoreItems.map(([label, score]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-[8px] bg-[#FBFAF7] px-4 py-4"
              >
                <span className="text-sm font-black text-[#111111]">{label}</span>
                <span className="text-sm font-black text-[#0F5132]">{score}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader
          title="배지는 무엇을 의미하나요?"
          description="Premium은 광고/노출 혜택이며, Verified와 구분해서 표시합니다."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {badgeItems.map((badge) => (
            <article
              key={badge.title}
              className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm"
            >
              <p
                className={`inline-flex rounded-full px-4 py-2 text-xs font-black ${
                  badge.title === "PREMIUM"
                    ? "bg-[#111111] text-white"
                    : "bg-[#E8F2EC] text-[#0F5132]"
                }`}
              >
                {badge.title}
              </p>
              <p className="mt-5 text-sm font-bold leading-7 text-[#374151]">
                {badge.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-[8px] bg-[#111111] p-6 text-white sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-white/60">
            Promise
          </p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">
            TRUPICK의 약속
          </h2>
          <p className="mt-4 max-w-3xl text-base font-bold leading-8 text-white/72 sm:text-lg">
            고객이 더 안심하고 비교할 수 있도록 검증 정보와 광고 정보를 분리해 보여드립니다.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {promiseItems.map((item) => (
              <article key={item} className="rounded-[8px] bg-white/10 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-black text-[#111111]">
                  ✓
                </span>
                <p className="mt-5 text-lg font-black leading-7 text-white">
                  {item}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
          <div>
            <SectionHeader
              title="전문가에게도 공정한 기준을 제공합니다."
              description="TRUPICK의 검증은 전문가를 배제하기 위한 절차가 아니라, 좋은 전문가가 자신의 전문성을 더 잘 보여줄 수 있도록 돕기 위한 기준입니다. 자격증만으로 판단하지 않고, 사례, 철학, 커뮤니케이션 방식까지 함께 봅니다."
            />
          </div>
          <Link
            href="/register"
            className="rounded-full bg-[#0F5132] px-7 py-4 text-center text-base font-black text-white transition hover:bg-[#146C43]"
          >
            검증 전문가로 등록하기
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="FAQ" title="자주 묻는 질문" />
        <VerificationFaqAccordion items={faqItems} />
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-7 text-center shadow-[0_24px_70px_rgba(24,24,20,0.10)] sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
            Start with trust
          </p>
          <h2 className="mt-3 text-4xl font-black text-[#111111]">
            검증된 전문가를 만나보세요.
          </h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/experts"
              className="rounded-full bg-[#0F5132] px-7 py-4 text-center text-base font-black text-white transition hover:bg-[#146C43]"
            >
              전문가 찾기
            </Link>
            <Link
              href="/match"
              className="rounded-full border border-[#111111] bg-white px-7 py-4 text-center text-base font-black text-[#111111] transition hover:bg-[#111111] hover:text-white"
            >
              AI 매칭 시작하기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
