type OnboardingStatus = "완료" | "진행중" | "확인 필요";

type OnboardingItem = {
  title: string;
  status: OnboardingStatus;
  owner: string;
  note: string;
};

const onboardingItems: OnboardingItem[] = [
  {
    title: "회원가입 완료",
    status: "완료",
    owner: "Expert",
    note: "전문가가 TRUPICK 계정을 생성하고 role이 expert인지 확인합니다.",
  },
  {
    title: "전문가 등록 완료",
    status: "진행중",
    owner: "Expert",
    note: "Wizard 등록 폼이 제출되어 approved=false, approval_status=pending 상태인지 확인합니다.",
  },
  {
    title: "프로필 사진 확인",
    status: "확인 필요",
    owner: "Admin",
    note: "실제 인물 오해, 저화질, 부적절한 이미지가 없는지 확인합니다.",
  },
  {
    title: "경력 입력 확인",
    status: "확인 필요",
    owner: "Admin",
    note: "경력 년수, 주요 경력, 잘 맞는 고객 유형이 구체적인지 검토합니다.",
  },
  {
    title: "자격/증빙 확인",
    status: "확인 필요",
    owner: "Admin",
    note: "자격증, 수료 과정, 포트폴리오 링크 등 검증 가능한 자료를 확인합니다.",
  },
  {
    title: "대표 사례 입력 확인",
    status: "확인 필요",
    owner: "Admin",
    note: "고객 문제, 진행 과정, 결과가 고객이 이해하기 쉽게 작성되었는지 봅니다.",
  },
  {
    title: "인터뷰 필요 여부",
    status: "진행중",
    owner: "TRUPICK",
    note: "전문가 철학, 고객 응대 방식, 사례 설명이 부족하면 인터뷰를 요청합니다.",
  },
  {
    title: "승인 완료",
    status: "진행중",
    owner: "Admin",
    note: "관리자 검토 후 approved=true, approval_status=approved로 변경합니다.",
  },
  {
    title: "첫 상담 테스트 완료",
    status: "확인 필요",
    owner: "Ops",
    note: "상담 요청 수신, 연락, 상태 변경, 리뷰 작성까지 베타 플로우를 점검합니다.",
  },
];

const statusStyles: Record<OnboardingStatus, string> = {
  완료: "bg-[#E8F2EC] text-[#0F5132]",
  진행중: "bg-[#FFF4E5] text-[#875200]",
  "확인 필요": "bg-[#F3F4F6] text-[#374151]",
};

const statusDescriptions: Record<OnboardingStatus, string> = {
  완료: "이미 완료되어 다음 단계로 넘어갈 수 있습니다.",
  진행중: "현재 처리 중이거나 운영자가 상태를 확인해야 합니다.",
  "확인 필요": "승인 전 수동 검토가 필요한 항목입니다.",
};

const statusCounts = onboardingItems.reduce<Record<OnboardingStatus, number>>(
  (counts, item) => {
    counts[item.status] += 1;
    return counts;
  },
  {
    완료: 0,
    진행중: 0,
    "확인 필요": 0,
  }
);

const completionRate = Math.round(
  (statusCounts["완료"] / onboardingItems.length) * 100
);

export default function ExpertOnboardingPage() {
  return (
    <main className="min-h-screen bg-[#F5F1E8] px-4 py-6 text-[#111111] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
            Expert Onboarding
          </p>
          <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-[-0.03em] text-[#111111]">
                전문가 온보딩 체크리스트
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-[#374151]">
                초기 전문가 모집 후 회원가입, 등록, 검증, 승인, 첫 상담
                테스트까지 빠뜨리지 않도록 관리하는 운영용 체크리스트입니다.
              </p>
            </div>
            <div className="rounded-[8px] bg-[#111111] p-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.14em]">
                Onboarding Ready
              </p>
              <p className="mt-2 text-5xl font-black tracking-[-0.04em]">
                {completionRate}%
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-3">
          {(["완료", "진행중", "확인 필요"] as OnboardingStatus[]).map(
            (status) => (
              <article
                key={status}
                className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-sm"
              >
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${statusStyles[status]}`}
                >
                  {status}
                </span>
                <p className="mt-4 text-4xl font-black text-[#111111]">
                  {statusCounts[status]}
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-[#374151]">
                  {statusDescriptions[status]}
                </p>
              </article>
            )
          )}
        </section>

        <section className="mt-5 grid gap-4">
          {onboardingItems.map((item, index) => (
            <article
              key={item.title}
              className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-sm"
            >
              <div className="grid gap-4 lg:grid-cols-[80px_minmax(0,1fr)_220px] lg:items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#111111] text-lg font-black text-white">
                  {index + 1}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-[#111111]">
                      {item.title}
                    </h2>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${statusStyles[item.status]}`}
                    >
                      {item.status}
                    </span>
                    <span className="rounded-full bg-[#FBFAF7] px-3 py-1 text-xs font-black text-[#374151]">
                      {item.owner}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-bold leading-7 text-[#374151]">
                    {item.note}
                  </p>
                </div>
                <div className="rounded-[8px] bg-[#FBFAF7] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0F5132]">
                    Next Action
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#111111]">
                    {item.status === "완료"
                      ? "다음 단계 확인"
                      : item.status === "진행중"
                        ? "담당자 처리"
                        : "수동 검토"}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
