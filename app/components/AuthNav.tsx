"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

type UserRole = "customer" | "expert" | "admin";

const linkStyle = {
  color: "#111111",
  textDecoration: "none",
  fontWeight: 800,
};

const secondaryMobileLinkStyle = {
  ...linkStyle,
};

export default function AuthNav() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    const client = supabase;
    let isMounted = true;

    async function loadRole(currentUser: User | null) {
      if (!currentUser) {
        return null;
      }

      const { data } = await client
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .maybeSingle<{ role: UserRole }>();

      return data?.role ?? (currentUser.user_metadata?.role as UserRole) ?? null;
    }

    async function loadUser() {
      const { data } = await client.auth.getUser();
      const profileRole = await loadRole(data.user);

      if (isMounted) {
        setUser(data.user);
        setRole(profileRole);
        setLoading(false);
      }
    }

    void loadUser();

    const { data: listener } = client.auth.onAuthStateChange(
      (_event, session) => {
        void loadRole(session?.user ?? null).then((profileRole) => {
          setUser(session?.user ?? null);
          setRole(profileRole);
          setLoading(false);
        });
      }
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  }

  return (
    <nav className="flex w-full flex-wrap items-center justify-start gap-2 text-sm sm:w-auto sm:justify-end sm:gap-4">
      <Link
        href="/how-we-verify"
        style={secondaryMobileLinkStyle}
        className="hidden sm:inline"
      >
        검증 기준
      </Link>
      <Link href="/beta" style={secondaryMobileLinkStyle} className="hidden sm:inline">
        Beta Test
      </Link>

      {loading ? null : user ? (
        <>
          {role === "admin" ? (
            <>
              <Link href="/admin/experts" style={linkStyle}>
                전문가 승인
              </Link>
              <Link href="/admin/requests" style={linkStyle}>
                상담 관리
              </Link>
              <Link
                href="/admin/reviews"
                style={secondaryMobileLinkStyle}
                className="hidden sm:inline"
              >
                리뷰 관리
              </Link>
            </>
          ) : role === "expert" ? (
            <>
              <Link href="/register" style={linkStyle}>
                전문가 등록
              </Link>
              <Link href="/my-consultations" style={linkStyle}>
                내 상담
              </Link>
            </>
          ) : (
            <>
              <Link href="/experts" style={linkStyle}>
                전문가 둘러보기
              </Link>
              <Link href="/my-consultations" style={linkStyle}>
                내 상담
              </Link>
            </>
          )}
          <Link href="/mypage" style={linkStyle}>
            마이페이지
          </Link>
          <Link href="/dashboard" style={linkStyle}>
            프로필
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-[#111111] px-4 py-2 text-sm font-black text-white"
          >
            로그아웃
          </button>
        </>
      ) : (
        <>
          <Link href="/login" style={linkStyle}>
            로그인
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-[#111111] px-4 py-2 text-sm font-black text-white"
          >
            회원가입
          </Link>
        </>
      )}
    </nav>
  );
}
