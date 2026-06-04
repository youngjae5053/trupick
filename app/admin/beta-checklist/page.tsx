type ChecklistStatus = "완료" | "확인 필요" | "미완료";

type ChecklistItem = {
  title: string;
  status: ChecklistStatus;
  note: string;
};

const checklistItems: ChecklistItem[] = [
  {
    title: "전문가 데이터 10명 이상",
    status: "완료",
    note: "베타용 전문가 mock 데이터가 16명으로 정리되어 있습니다.",
  },
  {
    title: "리뷰 데이터 20개 이상",
    status: "확인 필요",
    note: "리뷰 작성/관리 기능은 준비되어 있으며, Supabase 실제 데이터 수량 확인이 필요합니다.",
  },
  {
    title: "회원가입 정상",
    status: "완료",
    note: "Supabase Auth 회원가입과 profiles 생성 흐름이 연결되어 있습니다.",
  },
  {
    title: "로그인 정상",
    status: "완료",
    note: "로그인 후 role 기반 메뉴와 관리자 접근 제어가 동작합니다.",
  },
  {
    title: "전문가 등록 정상",
    status: "완료",
    note: "전문가 등록 시 승인 대기 상태로 저장됩니다.",
  },
  {
    title: "상담 신청 정상",
    status: "완료",
    note: "상담 신청 폼과 consultation_requests 저장 흐름이 준비되어 있습니다.",
  },
  {
    title: "관리자 상담 확인 정상",
    status: "완료",
    note: "관리자 상담 요청 관리 페이지에서 전체 신청과 상태 변경이 가능합니다.",
  },
  {
    title: "모바일 화면 정상",
    status: "확인 필요",
    note: "주요 화면은 반응형으로 구성되어 있으며, 실제 기기 최종 확인이 필요합니다.",
  },
  {
    title: "피드백 페이지 정상",
    status: "완료",
    note: "베타 피드백 제출과 관리자 피드백 관리 화면이 연결되어 있습니다.",
  },
  {
    title: "이메일 알림 설정 여부",
    status: "미완료",
    note: "상담 신청, 승인, Premium 안내 이메일 provider 연동이 아직 필요합니다.",
  },
];

const statusStyles: Record<ChecklistStatus, string> = {
  완료: "bg-[#E8F2EC] text-[#0F5132]",
  "확인 필요": "bg-[#FFF4E5] text-[#875200]",
  미완료: "bg-[#FEE2E2] text-[#991B1B]",
};

const statusDescriptions: Record<ChecklistStatus, string> = {
  완료: "베타 테스트에 바로 사용할 수 있는 항목입니다.",
  "확인 필요": "배포 직전 실제 데이터나 기기에서 한 번 더 확인해야 합니다.",
  미완료: "베타 운영 중 수동 처리 또는 후속 개발이 필요합니다.",
};

const statusCounts = checklistItems.reduce<Record<ChecklistStatus, number>>(
  (counts, item) => {
    counts[item.status] += 1;
    return counts;
  },
  {
    완료: 0,
    "확인 필요": 0,
    미완료: 0,
  }
);

const completionRate = Math.round(
  (statusCounts["완료"] / checklistItems.length) * 100
);

export default function BetaChecklistPage() {
  return (
    <main className="min-h-screen bg-[#F5F1E8] px-4 py-6 text-[#111111] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
            Beta Operations
          </p>
          <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
            <div>
              <h1 className="text-4xl font-black text-[#111111]">
                베타 테스트 운영 체크리스트
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-[#374151]">
                베타 테스트 전에 운영자가 핵심 기능과 데이터 상태를 한눈에
                점검할 수 있는 관리자용 체크리스트입니다.
              </p>
            </div>
            <div className="rounded-[8px] bg-[#111111] p-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white">
                Ready
              </p>
              <p className="mt-2 text-5xl font-black">{completionRate}%</p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-3">
          {(["완료", "확인 필요", "미완료"] as ChecklistStatus[]).map(
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

        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          {checklistItems.map((item) => (
            <article
              key={item.title}
              className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-xl font-black text-[#111111]">
                  {item.title}
                </h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${statusStyles[item.status]}`}
                >
                  {item.status}
                </span>
              </div>
              <p className="mt-4 text-sm font-bold leading-7 text-[#374151]">
                {item.note}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
