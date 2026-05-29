"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function RequestContent() {
  const searchParams = useSearchParams();
  const expertId = searchParams.get("expertId");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit() {
    const { error } = await supabase.from("requests").insert([
      {
        customer_name: name,
        phone,
        message,
        expert_id: expertId ? Number(expertId) : null,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("상담 요청이 접수되었습니다.");
    setName("");
    setPhone("");
    setMessage("");
  }

  return (
    <main style={{ minHeight: "100vh", background: "#F7F3EA", padding: "40px" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <Link
          href="/experts"
          style={{
            color: "#0F3D2E",
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          ← 전문가 목록으로
        </Link>

        <section
          style={{
            marginTop: "28px",
            background: "white",
            borderRadius: "32px",
            padding: "36px",
            border: "1px solid #E6DED0",
            boxShadow: "0 12px 35px rgba(0,0,0,0.06)",
          }}
        >
          <p
            style={{
              color: "#0F3D2E",
              fontWeight: 900,
              marginBottom: "10px",
            }}
          >
            COUNSELING REQUEST
          </p>

          <h1 style={{ fontSize: "38px", marginBottom: "14px" }}>
            상담 요청하기
          </h1>

          <p style={{ color: "#5B675F", lineHeight: 1.7, marginBottom: "30px" }}>
            전문가에게 전달할 기본 정보를 남겨주세요. TRUPICK은 무분별한 견적
            경쟁보다 서로에게 맞는 연결을 중요하게 생각합니다.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <input
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                padding: "18px 20px",
                borderRadius: "16px",
                border: "1px solid #D9CFBF",
                fontSize: "16px",
                background: "#FAF7F2",
              }}
            />

            <input
              placeholder="전화번호"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: "100%",
                padding: "18px 20px",
                borderRadius: "16px",
                border: "1px solid #D9CFBF",
                fontSize: "16px",
                background: "#FAF7F2",
              }}
            />

            <textarea
              placeholder="상담받고 싶은 내용을 적어주세요."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{
                width: "100%",
                padding: "18px 20px",
                borderRadius: "16px",
                border: "1px solid #D9CFBF",
                fontSize: "16px",
                background: "#FAF7F2",
                minHeight: "180px",
                resize: "vertical",
              }}
            />

            <button
              onClick={handleSubmit}
              style={{
                marginTop: "10px",
                width: "100%",
                padding: "18px",
                borderRadius: "16px",
                border: "none",
                background: "#0F3D2E",
                color: "white",
                fontSize: "17px",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              상담 요청 보내기
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function RequestPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            background: "#F7F3EA",
            padding: "40px",
          }}
        />
      }
    >
      <RequestContent />
    </Suspense>
  );
}
