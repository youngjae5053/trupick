"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import AuthNav from "@/app/components/AuthNav";

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
};

export default function HomePage() {
  const [experts, setExperts] = useState<Expert[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchExperts() {
      const { data } = await supabase
        .from("experts")
        .select("*")
        .eq("approved", true)
        .limit(3);

      if (isMounted) {
        setExperts(data || []);
      }
    }

    void fetchExperts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main style={{ background: "#F7F3EA", minHeight: "100vh" }}>
      <header
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "28px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "24px",
        }}
      >
        <h1 style={{ fontSize: "28px", fontWeight: 900 }}>TRUPICK</h1>

        <AuthNav />
      </header>

      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "80px 40px 100px",
        }}
      >
        <p
          style={{
            color: "#0F3D2E",
            fontWeight: 900,
            marginBottom: "18px",
          }}
        >
          검증된 전문가 연결 플랫폼
        </p>

        <h2
          style={{
            fontSize: "72px",
            lineHeight: 1.1,
            marginBottom: "28px",
          }}
        >
          믿을 수 있는 전문가를
          <br />
          더 쉽게 만나는 곳
        </h2>

        <p
          style={{
            fontSize: "20px",
            lineHeight: 1.8,
            color: "#5B675F",
            maxWidth: "760px",
          }}
        >
          TRUPICK은 고객이 검증된 전문가를 찾고, 전문가는 자신의 서비스를 등록해
          상담 요청을 받을 수 있는 매칭 플랫폼입니다. 승인된 전문가만 공개되므로
          더 안심하고 비교하고 선택할 수 있습니다.
        </p>

        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "40px",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/experts"
            style={{
              padding: "18px 26px",
              borderRadius: "18px",
              background: "#0F3D2E",
              color: "white",
              textDecoration: "none",
              fontWeight: 800,
            }}
          >
            전문가 둘러보기
          </Link>

          <Link
            href="/register"
            style={{
              padding: "18px 26px",
              borderRadius: "18px",
              background: "white",
              color: "#111",
              textDecoration: "none",
              fontWeight: 800,
              border: "1px solid #DDD",
            }}
          >
            전문가 등록하기
          </Link>

          <Link
            href="/login"
            style={{
              padding: "18px 26px",
              borderRadius: "18px",
              background: "#F1E8D8",
              color: "#111",
              textDecoration: "none",
              fontWeight: 800,
              border: "1px solid #D9CFBF",
            }}
          >
            로그인
          </Link>
        </div>
      </section>

      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 40px 100px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "28px",
          }}
        >
          <h3 style={{ fontSize: "34px" }}>추천 전문가</h3>

          <Link
            href="/experts"
            style={{
              color: "#0F3D2E",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            전체 보기 →
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          {experts.map((expert) => (
            <Link
              key={expert.id}
              href={`/experts/${expert.id}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                background: "white",
                borderRadius: "28px",
                overflow: "hidden",
                border: "1px solid #E6DED0",
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  height: "220px",
                  background: "linear-gradient(135deg, #E6DDCF, #F8F5EE)",
                }}
              />

              <div style={{ padding: "24px" }}>
                <span
                  style={{
                    background: "#E8F2EC",
                    color: "#0F3D2E",
                    padding: "8px 12px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 800,
                  }}
                >
                  VERIFIED
                </span>

                <h4
                  style={{
                    fontSize: "28px",
                    marginTop: "18px",
                    marginBottom: "10px",
                  }}
                >
                  {expert.name}
                </h4>

                <p style={{ color: "#5B675F" }}>{expert.specialty}</p>

                <p
                  style={{
                    marginTop: "14px",
                    color: "#2F3A34",
                    lineHeight: 1.7,
                  }}
                >
                  {expert.description}
                </p>

                <p
                  style={{
                    marginTop: "18px",
                    color: "#66736B",
                  }}
                >
                  지역 {expert.location}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
