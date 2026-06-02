type ChecklistStatus = "완료" | "진행중" | "미구현";

type ChecklistItem = {
  title: string;
  status: ChecklistStatus;
  note: string;
};

const checklistItems: ChecklistItem[] = [
  {
    title: "로그인 작동",
    status: "완료",
    note: "Supabase Auth 기반 로그인 화면과 관리자 권한 확인이 연결되어 있습니다.",
  },
  {
    title: "회원가입 작동",
    status: "완료",
    note: "이메일/비밀번호 회원가입 흐름이 준비되어 있습니다.",
  },
  {
    title: "전문가 등록 작동",
    status: "완료",
    note: "전문가 정보, 이미지, 플랜 선택 등록 흐름이 연결되어 있습니다.",
  },
  {
    title: "전문가 승인 작동",
    status: "완료",
    note: "관리자 전문가 승인/승인 취소 기능이 준비되어 있습니다.",
  },
  {
    title: "후기 작동",
    status: "미구현",
    note: "후기 테이블, 작성 UI, 노출 정책이 아직 필요합니다.",
  },
  {
    title: "상담 신청 작동",
    status: "완료",
    note: "상담 요청 저장과 관리자 상태 변경 기능이 연결되어 있습니다.",
  },
  {
    title: "관리자 페이지 작동",
    status: "완료",
    note: "관리자 권한 확인 후 전문가/상담 관리 페이지에 접근할 수 있습니다.",
  },
  {
    title: "AI 추천 작동",
    status: "진행중",
    note: "AI 매칭 리포트 UI와 mock 추천은 준비되었고 실제 AI 연결이 남아 있습니다.",
  },
  {
    title: "이메일 알림 설정 여부",
    status: "미구현",
    note: "요청 접수/승인 알림을 보낼 이메일 provider 연동이 필요합니다.",
  },
  {
    title: "결제 연동 여부",
    status: "미구현",
    note: "프리미엄 플랜 결제를 위한 PG/구독 연동이 필요합니다.",
  },
];

const statusStyles: Record<
  ChecklistStatus,
  { background: string; color: string; border: string }
> = {
  완료: {
    background: "#E8F2EC",
    color: "#0F3D2E",
    border: "#CFE4D6",
  },
  진행중: {
    background: "#FFF4E5",
    color: "#875200",
    border: "#F3D4A2",
  },
  미구현: {
    background: "#F7EAEA",
    color: "#9B1C1C",
    border: "#E6C4C4",
  },
};

const statusCounts = checklistItems.reduce<Record<ChecklistStatus, number>>(
  (counts, item) => {
    counts[item.status] += 1;
    return counts;
  },
  {
    완료: 0,
    진행중: 0,
    미구현: 0,
  }
);

const completionRate = Math.round(
  (statusCounts["완료"] / checklistItems.length) * 100
);

export default function LaunchChecklistPage() {
  return (
    <main style={{ minHeight: "100vh", padding: "40px", background: "#F7F3EA" }}>
      <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
        <section
          style={{
            background: "white",
            borderRadius: "24px",
            padding: "32px",
            border: "1px solid #E6DED0",
            boxShadow: "0 12px 35px rgba(0,0,0,0.06)",
            marginBottom: "24px",
          }}
        >
          <p
            style={{
              color: "#0F3D2E",
              fontWeight: 900,
              marginBottom: "12px",
            }}
          >
            BETA LAUNCH CHECKLIST
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "24px",
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1 style={{ fontSize: "40px", margin: 0 }}>
                베타 런칭 준비 점검
              </h1>
              <p
                style={{
                  marginTop: "14px",
                  color: "#5B675F",
                  lineHeight: 1.7,
                  maxWidth: "680px",
                }}
              >
                운영자가 핵심 기능의 준비 상태를 한눈에 확인할 수 있는 관리자용
                점검 보드입니다.
              </p>
            </div>

            <div
              style={{
                minWidth: "170px",
                borderRadius: "20px",
                background: "#0F3D2E",
                color: "white",
                padding: "22px",
                textAlign: "center",
              }}
            >
              <p style={{ opacity: 0.72, margin: 0, fontWeight: 800 }}>
                완료율
              </p>
              <p style={{ fontSize: "44px", fontWeight: 900, margin: "8px 0 0" }}>
                {completionRate}%
              </p>
            </div>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {(["완료", "진행중", "미구현"] as ChecklistStatus[]).map((status) => {
            const style = statusStyles[status];

            return (
              <div
                key={status}
                style={{
                  background: style.background,
                  color: style.color,
                  border: `1px solid ${style.border}`,
                  borderRadius: "18px",
                  padding: "20px",
                }}
              >
                <p style={{ margin: 0, fontWeight: 900 }}>{status}</p>
                <p style={{ margin: "10px 0 0", fontSize: "32px", fontWeight: 900 }}>
                  {statusCounts[status]}
                </p>
              </div>
            );
          })}
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "18px",
          }}
        >
          {checklistItems.map((item) => {
            const style = statusStyles[item.status];

            return (
              <article
                key={item.title}
                style={{
                  background: "white",
                  border: "1px solid #E6DED0",
                  borderRadius: "20px",
                  padding: "22px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "14px",
                  }}
                >
                  <h2 style={{ fontSize: "20px", margin: 0 }}>{item.title}</h2>
                  <span
                    style={{
                      flexShrink: 0,
                      background: style.background,
                      color: style.color,
                      border: `1px solid ${style.border}`,
                      borderRadius: "999px",
                      padding: "7px 10px",
                      fontSize: "12px",
                      fontWeight: 900,
                    }}
                  >
                    {item.status}
                  </span>
                </div>

                <p
                  style={{
                    marginTop: "16px",
                    color: "#5B675F",
                    lineHeight: 1.7,
                  }}
                >
                  {item.note}
                </p>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
