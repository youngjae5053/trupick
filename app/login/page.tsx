"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push("/");
  }

  return (
    <main style={{ minHeight: "100vh", background: "#F7F3EA", padding: "40px" }}>
      <section
        style={{
          maxWidth: "460px",
          margin: "0 auto",
          background: "white",
          borderRadius: "24px",
          padding: "36px",
          border: "1px solid #E6DED0",
        }}
      >
        <h1 style={{ fontSize: "36px", marginBottom: "24px" }}>로그인</h1>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid #D9CFBF",
            }}
          />

          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid #D9CFBF",
            }}
          />

          {errorMessage ? (
            <p style={{ color: "#9B1C1C", margin: 0 }}>{errorMessage}</p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: "none",
              background: "#0F3D2E",
              color: "white",
              fontWeight: 900,
              cursor: submitting ? "default" : "pointer",
            }}
          >
            {submitting ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p style={{ marginTop: "20px", color: "#5B675F" }}>
          계정이 없으신가요? <Link href="/signup">회원가입</Link>
        </p>
      </section>
    </main>
  );
}
