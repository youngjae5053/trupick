"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [career, setCareer] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let imageUrl = "";

    if (imageFile) {
      const fileName = `${Date.now()}-${imageFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("experts")
        .upload(fileName, imageFile);

      if (uploadError) {
        alert(uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from("experts")
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    const { error } = await supabase.from("experts").insert([
      {
        name,
        specialty,
        location,
        description,
        career,
        image_url: imageUrl,
      },
    ]);

    if (error) {
      console.error(error);
      alert("등록에 실패했습니다.");
    } else {
      alert("등록이 완료되었습니다.");
      router.push("/experts");
    }
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
