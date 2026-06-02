"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/supabase";
import { getFriendlyErrorMessage } from "@/app/errorMessages";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");

    if (password.length < 8) {
      setErrorMessage("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setSubmitting(false);

    if (error) {
      setErrorMessage(getFriendlyErrorMessage(error.message));
      return;
    }

    router.push("/login");
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
        <h1 style={{ fontSize: "36px", marginBottom: "24px" }}>회원가입</h1>

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
            minLength={8}
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid #D9CFBF",
            }}
          />

          <input
            type="password"
            placeholder="비밀번호 확인"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
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
            {submitting ? "계정 생성 중..." : "계정 만들기"}
          </button>
        </form>

        <p style={{ marginTop: "20px", color: "#5B675F" }}>
          이미 계정이 있으신가요? <Link href="/login">로그인</Link>
        </p>
      </section>
    </main>
  );
}
