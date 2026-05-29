"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/app/supabase";

const linkStyle = {
  color: "#111",
  textDecoration: "none",
  fontWeight: 700,
};

export default function AuthNav() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();

      if (isMounted) {
        setUser(data.user);
        setLoading(false);
      }
    }

    void loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        gap: "20px",
        flexWrap: "wrap",
        justifyContent: "flex-end",
      }}
    >
      <Link href="/experts" style={linkStyle}>
        전문가 둘러보기
      </Link>
      <Link href="/register" style={linkStyle}>
        전문가 등록하기
      </Link>
      <Link href="/admin/experts" style={linkStyle}>
        전문가 승인
      </Link>
      <Link href="/admin/requests" style={linkStyle}>
        상담 관리
      </Link>

      {loading ? null : user ? (
        <>
          <span style={{ color: "#5B675F", fontSize: "14px" }}>
            {user.email}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              border: "1px solid #D9CFBF",
              background: "white",
              borderRadius: "12px",
              padding: "10px 14px",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            로그아웃
          </button>
        </>
      ) : (
        <Link href="/login" style={linkStyle}>
          로그인
        </Link>
      )}
    </nav>
  );
}
