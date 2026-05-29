"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Expert = {
  id: number;
  name: string;
  specialty: string;
  location: string;
  description: string;
  career: string | null;
  approved: boolean | null;
};

export default function AdminExpertsPage() {
  const [experts, setExperts] = useState<Expert[]>([]);

  async function refreshExperts() {
    const { data } = await supabase
      .from("experts")
      .select("*")
      .order("id", { ascending: false });

    setExperts(data || []);
  }

  useEffect(() => {
    let isMounted = true;

    async function fetchExperts() {
      const { data } = await supabase
        .from("experts")
        .select("*")
        .order("id", { ascending: false });

      if (isMounted) {
        setExperts(data || []);
      }
    }

    void fetchExperts();

    return () => {
      isMounted = false;
    };
  }, []);

  async function approveExpert(id: number) {
    await supabase
      .from("experts")
      .update({ approved: true })
      .eq("id", id);

    refreshExperts();
  }

  async function unapproveExpert(id: number) {
    await supabase
      .from("experts")
      .update({ approved: false })
      .eq("id", id);

    refreshExperts();
  }

  return (
    <main style={{ minHeight: "100vh", padding: "40px", background: "#F7F3EA" }}>
      <h1 style={{ fontSize: "32px", marginBottom: "32px" }}>
        전문가 승인 관리
      </h1>

      <h2 style={{ marginBottom: "20px" }}>승인 대기</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "60px" }}>
        {experts
          .filter((expert) => !expert.approved)
          .map((expert) => (
            <div key={expert.id} style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #E6DED0" }}>
              <p><strong>이름:</strong> {expert.name}</p>
              <p><strong>전문 분야:</strong> {expert.specialty}</p>
              <p><strong>지역:</strong> {expert.location}</p>
              <p><strong>소개:</strong> {expert.description}</p>
              <p><strong>경력:</strong> {expert.career}</p>

              <button
                onClick={() => approveExpert(expert.id)}
                style={{
                  marginTop: "16px",
                  padding: "12px 18px",
                  borderRadius: "12px",
                  border: "none",
                  background: "#0F3D2E",
                  color: "white",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                승인하기
              </button>
            </div>
          ))}
      </div>

      <h2 style={{ marginBottom: "20px" }}>승인 완료</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {experts
          .filter((expert) => expert.approved)
          .map((expert) => (
            <div key={expert.id} style={{ background: "#F1F6F3", padding: "24px", borderRadius: "16px", border: "1px solid #D6E4DA" }}>
              <p><strong>이름:</strong> {expert.name}</p>
              <p><strong>전문 분야:</strong> {expert.specialty}</p>
              <p><strong>지역:</strong> {expert.location}</p>
              <p style={{ marginTop: "14px", color: "#0F3D2E", fontWeight: 800 }}>
                승인 완료
              </p>
              <button
                onClick={() => unapproveExpert(expert.id)}
                style={{
                  marginTop: "16px",
                  padding: "12px 18px",
                  borderRadius: "12px",
                  border: "none",
                  background: "#9B1C1C",
                  color: "white",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                승인 취소
              </button>
            </div>
          ))}
      </div>
    </main>
  );
}
