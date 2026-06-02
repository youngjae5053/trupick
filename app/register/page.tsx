"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";
import { getFriendlyErrorMessage } from "@/app/errorMessages";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [career, setCareer] = useState("");
  const [planType, setPlanType] = useState<"free" | "premium">("free");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      alert("서비스 연결 설정을 확인하는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    let imageUrl = "";

    if (imageFile) {
      const fileName = `${Date.now()}-${imageFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("experts")
        .upload(fileName, imageFile);

      if (uploadError) {
        alert(getFriendlyErrorMessage(uploadError.message));
        return;
      }

      const { data } = supabase.storage
        .from("experts")
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    const expertPayload = {
      name,
      specialty,
      location,
      description,
      career,
      image_url: imageUrl,
      approved: false,
    };

    const { error } = await supabase.from("experts").insert([
      {
        ...expertPayload,
        plan_type: planType,
        status: "pending",
      },
    ]);

    const retryWithoutStatus =
      error &&
      (error.message.includes("status") || error.message.includes("schema cache"))
        ? await supabase.from("experts").insert([
            {
              ...expertPayload,
              plan_type: planType,
            },
          ])
        : null;

    const retryWithoutPlan =
      (retryWithoutStatus?.error || error)?.message.includes("plan_type")
        ? await supabase.from("experts").insert([expertPayload])
        : null;

    const submitError = retryWithoutPlan?.error ?? retryWithoutStatus?.error ?? error;

    if (submitError) {
      console.error(submitError);
      alert(getFriendlyErrorMessage(submitError.message));
    } else {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#f7f3ea] px-4 py-10 text-[#111111]">
        <section className="mx-auto max-w-2xl rounded-[8px] border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0F5132] text-xl font-black text-white">
            ✓
          </div>
          <h1 className="mt-5 text-4xl font-black">등록이 접수되었습니다</h1>
          <p className="mt-4 text-base font-bold leading-7 text-[#4B5563]">
            전문가 정보는 검토 후 승인됩니다. 승인 완료 전까지 일반 사용자 화면에는 노출되지 않습니다.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="rounded-full bg-[#111111] px-6 py-3 text-sm font-black text-white"
            >
              홈으로
            </Link>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setName("");
                setSpecialty("");
                setLocation("");
                setDescription("");
                setCareer("");
                setImageFile(null);
              }}
              className="rounded-full border border-[#E5E7EB] bg-white px-6 py-3 text-sm font-black text-[#111111]"
            >
              추가 등록
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f3ea",
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
        }}
      >
        <h1 style={{ fontSize: "40px", fontWeight: "bold" }}>
          전문가 등록
        </h1>
        <Link
          href="/free-vs-premium"
          style={{
            display: "inline-block",
            marginTop: "14px",
            color: "#0F3D2E",
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          무료/프리미엄 플랜 비교 →
        </Link>

        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: "32px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <input
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            placeholder="전문 분야"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />

          <input
            placeholder="활동 지역"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <textarea
            placeholder="소개"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <textarea
            placeholder="경력"
            value={career}
            onChange={(e) => setCareer(e.target.value)}
          />

          <div
            style={{
              display: "grid",
              gap: "10px",
              padding: "16px",
              borderRadius: "16px",
              border: "1px solid #D9CFBF",
              background: "#FAF7F2",
            }}
          >
            <strong>플랜 선택</strong>
            <label style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="radio"
                name="planType"
                value="free"
                checked={planType === "free"}
                onChange={() => setPlanType("free")}
              />
              무료 플랜 · 기본 노출
            </label>
            <label style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="radio"
                name="planType"
                value="premium"
                checked={planType === "premium"}
                onChange={() => setPlanType("premium")}
              />
              프리미엄 플랜 · 상단 노출과 PREMIUM 배지
            </label>
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files) {
                setImageFile(e.target.files[0]);
              }
            }}
          />

          <button
            type="submit"
            style={{
              background: "black",
              color: "white",
              padding: "16px",
              borderRadius: "12px",
              border: "none",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            등록하기
          </button>
        </form>
      </div>
    </main>
  );
}
