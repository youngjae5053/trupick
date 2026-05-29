import Link from "next/link";
import { notFound } from "next/navigation";
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
  image_url: string | null;
};

export default async function ExpertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: expert } = await supabase
    .from("experts")
    .select("id, name, specialty, location, description, career, image_url")
    .eq("id", id)
    .eq("approved", true)
    .maybeSingle<Expert>();

  if (!expert) {
    notFound();
  }

  return (
    <main style={{ minHeight: "100vh", background: "#F7F3EA", padding: "40px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <Link
          href="/experts"
          style={{
            display: "inline-block",
            color: "#0F3D2E",
            fontWeight: 800,
            textDecoration: "none",
            marginBottom: "28px",
          }}
        >
          ← 전문가 목록으로
        </Link>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.2fr",
            gap: "32px",
            alignItems: "start",
          }}
        >
          <section
            style={{
              background: "white",
              borderRadius: "32px",
              padding: "28px",
              border: "1px solid #E6DED0",
              boxShadow: "0 12px 35px rgba(0,0,0,0.06)",
            }}
          >
            <img
              src={expert.image_url || "https://placehold.co/800x600"}
              alt={expert.name}
              style={{
                width: "100%",
                height: "520px",
                objectFit: "cover",
                background: "#E6DDCF",
                borderRadius: "26px",
                marginBottom: "24px",
              }}
            />

            <span
              style={{
                display: "inline-block",
                background: "#E8F2EC",
                color: "#0F3D2E",
                padding: "8px 14px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 900,
              }}
            >
              VERIFIED
            </span>

            <h1 style={{ fontSize: "38px", marginTop: "18px", marginBottom: "10px" }}>
              {expert.name}
            </h1>

            <p style={{ color: "#5B675F", fontSize: "18px", lineHeight: 1.6 }}>
              {expert.specialty}
            </p>

            <div style={{ marginTop: "24px", display: "grid", gap: "12px" }}>
              <p>지역 {expert.location}</p>
              <p>평점 4.9</p>
              <p>TRUPICK 검증 완료</p>
            </div>
          </section>

          <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div
              style={{
                background: "white",
                borderRadius: "28px",
                padding: "28px",
                border: "1px solid #E6DED0",
              }}
            >
              <h2 style={{ fontSize: "26px", marginBottom: "16px" }}>
                이 전문가를 추천하는 이유
              </h2>

              <div style={{ lineHeight: 1.8, color: "#2F3A34" }}>
                <p>{expert.description}</p>

                <p style={{ marginTop: "18px" }}>
                  회원님의 목표와 현재 상태를 바탕으로 맞춤형 진행 방향을 제안합니다.
                </p>

                <p style={{ marginTop: "18px" }}>
                  처음 상담을 받는 분부터 구체적인 해결책이 필요한 분까지 체계적으로
                  접근할 수 있습니다.
                </p>
              </div>
            </div>

            <div
              style={{
                background: "white",
                borderRadius: "28px",
                padding: "28px",
                border: "1px solid #E6DED0",
              }}
            >
              <h2 style={{ fontSize: "26px", marginBottom: "16px" }}>
                자격 및 경력
              </h2>

              <p style={{ lineHeight: 1.8, color: "#2F3A34" }}>
                {expert.career}
              </p>
            </div>

            <div
              style={{
                background: "#0F3D2E",
                borderRadius: "28px",
                padding: "30px",
                color: "white",
              }}
            >
              <p style={{ opacity: 0.75, marginBottom: "8px" }}>
                상담 신청
              </p>

              <h2 style={{ fontSize: "28px", marginBottom: "18px" }}>
                이 전문가에게 상담을 요청해보세요.
              </h2>

              <Link
                href={`/request?expertId=${expert.id}`}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "18px",
                  borderRadius: "16px",
                  border: "none",
                  background: "white",
                  color: "#0F3D2E",
                  fontSize: "17px",
                  fontWeight: 900,
                  cursor: "pointer",
                  textAlign: "center",
                  textDecoration: "none",
                }}
              >
                상담 신청하기
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
