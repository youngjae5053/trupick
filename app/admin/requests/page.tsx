"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type CounselingRequest = {
  id: number;
  customer_name: string;
  phone: string;
  message: string;
  expert_id: number | null;
  status: string | null;
  created_at: string;
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<CounselingRequest[]>([]);

  async function refreshRequests() {
    const { data } = await supabase
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false });

    setRequests(data || []);
  }

  useEffect(() => {
    let isMounted = true;

    async function fetchRequests() {
      const { data } = await supabase
        .from("requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (isMounted) {
        setRequests(data || []);
      }
    }

    void fetchRequests();

    return () => {
      isMounted = false;
    };
  }, []);

  async function changeStatus(id: number, status: string) {
    await supabase
      .from("requests")
      .update({ status })
      .eq("id", id);

    refreshRequests();
  }

  return (
    <main style={{ minHeight: "100vh", padding: "40px", background: "#f5f5f5" }}>
      <h1 style={{ fontSize: "32px", marginBottom: "32px" }}>
        상담 요청 관리
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {requests.map((request) => (
          <div key={request.id} style={{ background: "white", padding: "24px", borderRadius: "16px" }}>
            <p><strong>고객명:</strong> {request.customer_name}</p>
            <p><strong>전화번호:</strong> {request.phone}</p>
            <p><strong>내용:</strong> {request.message}</p>
            <p><strong>전문가 ID:</strong> {request.expert_id}</p>
            <p>
              <strong>상태:</strong>{" "}
              {request.status === "new"
                ? "신규 요청"
                : request.status === "matched"
                ? "매칭 완료"
                : "상담 완료"}
            </p>
            <button
              onClick={() => changeStatus(request.id, "matched")}
              style={{
                marginTop: "16px",
                marginRight: "10px",
                padding: "10px 16px",
                borderRadius: "10px",
                border: "none",
                background: "#111",
                color: "white",
                cursor: "pointer",
              }}
            >
              매칭 완료
            </button>

            <button
              onClick={() => changeStatus(request.id, "completed")}
              style={{
                padding: "10px 16px",
                borderRadius: "10px",
                border: "none",
                background: "#0F3D2E",
                color: "white",
                cursor: "pointer",
              }}
            >
              상담 완료
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
