"use client";

import Link from "next/link";
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
  career: string;
  image_url: string;
};

export default function ExpertsPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchExperts() {
      const { data } = await supabase
        .from("experts")
        .select("*")
        .eq("approved", true)
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

  const filteredExperts = experts.filter((expert) => {
    const keyword = search.toLowerCase();

    return (
      expert.name?.toLowerCase().includes(keyword) ||
      expert.specialty?.toLowerCase().includes(keyword) ||
      expert.location?.toLowerCase().includes(keyword)
    );
  });

  return (
    <main style={{ minHeight: "100vh", background: "#F7F3EA", padding: "40px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <Link href="/" style={{ color: "#0F3D2E", fontWeight: 700 }}>
          ← TRUPICK
        </Link>

        <section style={{ marginTop: "32px", marginBottom: "36px" }}>
          <p style={{ color: "#0F3D2E", fontWeight: 800, marginBottom: "10px" }}>
            VERIFIED EXPERTS
          </p>

          <h1 style={{ fontSize: "44px", fontWeight: 900, margin: 0 }}>
            내 주변의 검증된 전문가
          </h1>

          <p style={{ marginTop: "16px", color: "#5B675F", fontSize: "18px" }}>
            전문 분야와 지역을 기준으로 나에게 맞는 전문가를 찾아보세요.
          </p>
        </section>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름, 전문 분야, 지역으로 검색"
          style={{
            width: "100%",
            padding: "18px 20px",
            borderRadius: "18px",
            border: "1px solid #D9CFBF",
            marginBottom: "32px",
            fontSize: "16px",
            background: "white",
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {filteredExperts.map((expert) => (
            <Link
              key={expert.id}
              href={`/experts/${expert.id}`}
              style={{
                display: "block",
                textDecoration: "none",
                color: "inherit",
                background: "white",
                borderRadius: "28px",
                overflow: "hidden",
                border: "1px solid #E6DED0",
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              }}
            >
              <img
                src={expert.image_url || "https://placehold.co/600x400"}
                alt={expert.name}
                style={{
                  width: "100%",
                  height: "220px",
                  objectFit: "cover",
                }}
              />

              <div style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
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

                  <span style={{ fontWeight: 700 }}>평점 4.9</span>
                </div>

                <h2 style={{ fontSize: "24px", marginTop: "18px", marginBottom: "10px" }}>
                  {expert.name}
                </h2>

                <p style={{ color: "#5B675F", lineHeight: 1.6 }}>
                  {expert.specialty}
                </p>

                <p style={{ marginTop: "16px", color: "#66736B" }}>
                  지역 {expert.location}
                </p>

                <p style={{ marginTop: "16px", lineHeight: 1.6, color: "#2F3A34" }}>
                  {expert.description}
                </p>

                <div
                  style={{
                    marginTop: "22px",
                    paddingTop: "18px",
                    borderTop: "1px solid #ECE4D7",
                    fontWeight: 800,
                    color: "#0F3D2E",
                  }}
                >
                  프로필 보기 →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
