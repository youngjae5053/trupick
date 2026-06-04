"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";
import type { AnalyticsEventName } from "@/app/analytics";

type AnalyticsEvent = {
  id: number;
  user_id: string | null;
  event_name: AnalyticsEventName;
  page: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const trackedEvents: AnalyticsEventName[] = [
  "page_view",
  "signup",
  "login",
  "expert_register",
  "expert_view",
  "consultation_request",
  "review_created",
  "ai_match_started",
  "ai_match_completed",
  "feedback_submitted",
];

const eventLabels: Record<AnalyticsEventName, string> = {
  page_view: "페이지 조회",
  signup: "회원가입",
  login: "로그인",
  expert_register: "전문가 등록",
  expert_view: "전문가 조회",
  consultation_request: "상담 신청",
  review_created: "후기 작성",
  ai_match_started: "AI 추천 시작",
  ai_match_completed: "AI 추천 완료",
  feedback_submitted: "피드백 제출",
};

function isToday(createdAt: string) {
  const createdDate = new Date(createdAt);
  const now = new Date();

  return (
    createdDate.getFullYear() === now.getFullYear() &&
    createdDate.getMonth() === now.getMonth() &&
    createdDate.getDate() === now.getDate()
  );
}

function getMetadataText(
  metadata: Record<string, unknown> | null,
  key: string
) {
  const value = metadata?.[key];

  return typeof value === "string" ? value : null;
}

function getTopValue(values: Array<string | null>) {
  const counts = values.reduce<Record<string, number>>((result, value) => {
    if (!value) {
      return result;
    }

    result[value] = (result[value] ?? 0) + 1;
    return result;
  }, {});

  return (
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? ["데이터 없음", 0]
  );
}

export default function AdminAnalyticsPage() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchEvents() {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("analytics_events")
        .select("id, user_id, event_name, page, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (isMounted) {
        setEvents((data as AnalyticsEvent[]) || []);
        setLoading(false);
      }
    }

    void fetchEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  const analytics = useMemo(() => {
    const todayEvents = events.filter((event) => isToday(event.created_at));
    const todayVisits = todayEvents.filter(
      (event) => event.event_name === "page_view"
    ).length;
    const consultationRequests = todayEvents.filter(
      (event) => event.event_name === "consultation_request"
    ).length;
    const aiMatches = todayEvents.filter(
      (event) =>
        event.event_name === "ai_match_started" ||
        event.event_name === "ai_match_completed"
    ).length;

    const [topExpert, topExpertCount] = getTopValue(
      events
        .filter((event) => event.event_name === "expert_view")
        .map((event) => getMetadataText(event.metadata, "expert_name"))
    );
    const [topCategory, topCategoryCount] = getTopValue(
      events.map((event) => getMetadataText(event.metadata, "category"))
    );

    const eventCounts = trackedEvents.map((eventName) => ({
      eventName,
      label: eventLabels[eventName],
      count: events.filter((event) => event.event_name === eventName).length,
    }));
    const maxEventCount = Math.max(
      1,
      ...eventCounts.map((event) => event.count)
    );

    return {
      todayVisits,
      consultationRequests,
      aiMatches,
      topExpert,
      topExpertCount,
      topCategory,
      topCategoryCount,
      eventCounts,
      maxEventCount,
    };
  }, [events]);

  return (
    <main style={{ minHeight: "100vh", padding: "40px", background: "#F7F3EA" }}>
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
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
            ANALYTICS
          </p>
          <h1 style={{ fontSize: "40px", margin: 0 }}>
            사용자 행동 분석
          </h1>
          <p
            style={{
              marginTop: "14px",
              color: "#5B675F",
              lineHeight: 1.7,
              maxWidth: "720px",
            }}
          >
            페이지 조회, 상담 신청, AI 추천 사용 흐름을 추적해 베타 운영 상태를
            확인합니다.
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {[
            ["오늘 방문 수", analytics.todayVisits],
            ["상담 신청 수", analytics.consultationRequests],
            ["AI 추천 사용 수", analytics.aiMatches],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                background: "white",
                border: "1px solid #E6DED0",
                borderRadius: "20px",
                padding: "22px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
              }}
            >
              <p style={{ margin: 0, color: "#5B675F", fontWeight: 800 }}>
                {label}
              </p>
              <p style={{ margin: "12px 0 0", fontSize: "38px", fontWeight: 900 }}>
                {loading ? "-" : value}
              </p>
            </div>
          ))}
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "18px",
            marginBottom: "24px",
          }}
        >
          <article
            style={{
              background: "#0F3D2E",
              color: "white",
              borderRadius: "22px",
              padding: "26px",
            }}
          >
            <p style={{ opacity: 0.72, margin: 0, fontWeight: 800 }}>
              가장 많이 조회된 전문가
            </p>
            <h2 style={{ fontSize: "30px", margin: "14px 0 0" }}>
              {loading ? "-" : analytics.topExpert}
            </h2>
            <p style={{ opacity: 0.72, margin: "10px 0 0", fontWeight: 800 }}>
              {analytics.topExpertCount}회 조회
            </p>
          </article>

          <article
            style={{
              background: "white",
              border: "1px solid #E6DED0",
              borderRadius: "22px",
              padding: "26px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
            }}
          >
            <p style={{ color: "#5B675F", margin: 0, fontWeight: 800 }}>
              가장 인기 있는 카테고리
            </p>
            <h2 style={{ fontSize: "30px", margin: "14px 0 0" }}>
              {loading ? "-" : analytics.topCategory}
            </h2>
            <p style={{ color: "#5B675F", margin: "10px 0 0", fontWeight: 800 }}>
              {analytics.topCategoryCount}회 기록
            </p>
          </article>
        </section>

        <section
          style={{
            background: "white",
            border: "1px solid #E6DED0",
            borderRadius: "24px",
            padding: "28px",
            boxShadow: "0 12px 35px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
              alignItems: "center",
              marginBottom: "24px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p style={{ color: "#0F3D2E", margin: 0, fontWeight: 900 }}>
                EVENT CHART
              </p>
              <h2 style={{ margin: "8px 0 0", fontSize: "28px" }}>
                이벤트별 누적 기록
              </h2>
            </div>
            <p style={{ margin: 0, color: "#5B675F", fontWeight: 800 }}>
              최근 1,000개 이벤트 기준
            </p>
          </div>

          <div style={{ display: "grid", gap: "16px" }}>
            {analytics.eventCounts.map((event) => (
              <div
                key={event.eventName}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(120px, 180px) 1fr 48px",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                <p style={{ margin: 0, fontWeight: 900 }}>{event.label}</p>
                <div
                  style={{
                    height: "14px",
                    background: "#F1E8D8",
                    borderRadius: "999px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${(event.count / analytics.maxEventCount) * 100}%`,
                      height: "100%",
                      background: "#0F3D2E",
                      borderRadius: "999px",
                    }}
                  />
                </div>
                <p style={{ margin: 0, textAlign: "right", fontWeight: 900 }}>
                  {event.count}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
