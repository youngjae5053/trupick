"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

type Expert = {
  id: number;
  name: string;
  specialty: string;
  location: string;
  description: string;
  career: string | null;
  plan_type: "free" | "premium" | null;
};

export default function ExpertDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [expert, setExpert] = useState<Expert | null>(null);

  useEffect(() => {
    async function fetchExpert() {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        return;
      }

      const { data } = await supabase
        .from("experts")
        .select("*")
        .eq("id", params.id)
        .single();

      setExpert(data);
    }

    fetchExpert();
  }, [params.id]);

  if (!expert) {
    return <div style={{ padding: "40px" }}>불러오는 중...</div>;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F3EA",
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          background: "white",
          padding: "40px",
          borderRadius: "24px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            fontSize: "36px",
            marginBottom: "12px",
          }}
        >
          {expert.name}
        </h1>

        <p
          style={{
            color: "#666",
            marginBottom: "24px",
          }}
        >
          {expert.specialty}
        </p>

        <div style={{ marginBottom: "20px" }}>
          <strong>지역</strong>
          <p>{expert.location}</p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <strong>현재 플랜</strong>
          <p>{expert.plan_type === "premium" ? "프리미엄" : "무료"}</p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <strong>소개</strong>
          <p>{expert.description}</p>
        </div>

        <div style={{ marginBottom: "32px" }}>
          <strong>경력</strong>
          <p>{expert.career}</p>
        </div>

        <a
          href={`/request?expertId=${expert.id}`}
          style={{
            display: "inline-block",
            padding: "16px 24px",
            borderRadius: "14px",
            background: "#111",
            color: "white",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          상담 요청하기
        </a>
      </div>
    </main>
  );
}
