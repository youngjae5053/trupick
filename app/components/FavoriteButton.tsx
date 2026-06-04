"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFriendlyErrorMessage } from "@/app/errorMessages";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

export default function FavoriteButton({
  expertId,
  size = "default",
}: {
  expertId: number;
  size?: "default" | "compact";
}) {
  const router = useRouter();
  const [favoriteId, setFavoriteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadFavorite() {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        return;
      }

      const { data: userData } = await supabase.auth.getUser();

      if (!isMounted || !userData.user) {
        return;
      }

      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", userData.user.id)
        .eq("expert_id", expertId)
        .maybeSingle<{ id: number }>();

      if (isMounted) {
        setFavoriteId(data?.id ?? null);
      }
    }

    void loadFavorite();

    return () => {
      isMounted = false;
    };
  }, [expertId]);

  async function toggleFavorite() {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setMessage("서비스 연결 설정을 확인하는 중입니다.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      const redirectPath =
        typeof window === "undefined" ? "/experts" : window.location.pathname;
      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }

    setLoading(true);
    setMessage("");

    if (favoriteId) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId)
        .eq("user_id", userData.user.id);

      setLoading(false);

      if (error) {
        setMessage(getFriendlyErrorMessage(error.message));
        return;
      }

      setFavoriteId(null);
      setMessage("즐겨찾기에서 해제했습니다.");
      return;
    }

    const { data, error } = await supabase
      .from("favorites")
      .insert([
        {
          user_id: userData.user.id,
          expert_id: expertId,
        },
      ])
      .select("id")
      .single<{ id: number }>();

    setLoading(false);

    if (error) {
      setMessage(getFriendlyErrorMessage(error.message));
      return;
    }

    setFavoriteId(data?.id ?? null);
    setMessage("즐겨찾기에 저장했습니다.");
  }

  const isFavorite = Boolean(favoriteId);

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggleFavorite}
        disabled={loading}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
        className={`inline-flex items-center justify-center rounded-full border font-black transition disabled:opacity-70 ${
          isFavorite
            ? "border-[#0F5132] bg-[#0F5132] text-white"
            : "border-[#D9CFBF] bg-white text-[#111111] hover:border-[#111111]"
        } ${
          size === "compact"
            ? "h-10 w-10 text-lg"
            : "gap-2 px-4 py-3 text-sm"
        }`}
      >
        <span>{isFavorite ? "♥" : "♡"}</span>
        {size === "default" ? (
          <span>{isFavorite ? "저장됨" : "저장"}</span>
        ) : null}
      </button>
      {message && size === "default" ? (
        <p className="text-xs font-bold text-[#374151]">{message}</p>
      ) : null}
    </div>
  );
}
