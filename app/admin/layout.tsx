"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/app/supabase";

function isAdmin(user: User | null) {
  if (!user) {
    return false;
  }

  const appMetadata = user.app_metadata as {
    role?: unknown;
    is_admin?: unknown;
  };

  return appMetadata.role === "admin" || appMetadata.is_admin === true;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkAdminAccess() {
      const { data, error } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (error || !isAdmin(data.user)) {
        router.replace("/login");
        return;
      }

      setAuthorized(true);
      setCheckingAuth(false);
    }

    void checkAdminAccess();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (checkingAuth || !authorized) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#F7F3EA",
          color: "#0F3D2E",
          fontWeight: 800,
        }}
      >
        관리자 권한을 확인하는 중...
      </main>
    );
  }

  return <>{children}</>;
}
