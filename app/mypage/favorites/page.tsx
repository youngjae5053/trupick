"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FavoriteButton from "@/app/components/FavoriteButton";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

type FavoriteRow = {
  id: number;
  expert_id: number;
  created_at: string;
};

type ExpertRow = {
  id: number;
  name: string;
  specialty: string;
  location: string;
  description: string | null;
  image_url: string | null;
  plan_type: "free" | "premium" | null;
  approved: boolean | null;
  status?: string | null;
};

type SavedExpert = FavoriteRow & {
  expert: ExpertRow | null;
};

function formatSavedDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export default function FavoriteExpertsPage() {
  const router = useRouter();
  const [savedExperts, setSavedExperts] = useState<SavedExpert[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadFavorites() {
      try {
        const supabase = getSupabaseBrowserClient();

        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError) {
          console.error("favorites auth user error", userError);
        }

        const user = userData.user;

        if (!isMounted) {
          return;
        }

        if (!user) {
          router.replace("/login?redirect=/mypage/favorites");
          return;
        }

        const { data: favoriteRows, error: favoriteError } = await supabase
          .from("favorites")
          .select("id, expert_id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .returns<FavoriteRow[]>();

        if (!isMounted) {
          return;
        }

        if (favoriteError) {
          console.error("favorites lookup error", favoriteError);
          setSavedExperts([]);
          setErrorMessage(
            "저장한 전문가 정보를 불러오지 못했습니다. 잠시 후 다시 확인해주세요."
          );
          setLoading(false);
          return;
        }

        const favorites = favoriteRows || [];
        const expertIds = favorites.map((favorite) => favorite.expert_id);

        if (expertIds.length === 0) {
          setSavedExperts([]);
          setLoading(false);
          return;
        }

        const { data: expertRows, error: expertError } = await supabase
          .from("experts")
          .select(
            "id, name, specialty, location, description, image_url, plan_type, approved, status"
          )
          .in("id", expertIds)
          .eq("approved", true)
          .or("status.is.null,status.neq.rejected")
          .returns<ExpertRow[]>();

        if (!isMounted) {
          return;
        }

        if (expertError) {
          console.error("favorites expert lookup error", expertError);
          setSavedExperts(
            favorites.map((favorite) => ({
              ...favorite,
              expert: null,
            }))
          );
          setErrorMessage(
            "일부 전문가 정보를 불러오지 못했습니다. 저장 목록은 유지됩니다."
          );
          setLoading(false);
          return;
        }

        const expertById = new Map(
          (expertRows || []).map((expert) => [expert.id, expert])
        );

        setSavedExperts(
          favorites.map((favorite) => ({
            ...favorite,
            expert: expertById.get(favorite.expert_id) ?? null,
          }))
        );
        setLoading(false);
      } catch (error) {
        console.error("favorites load error", error);

        if (isMounted) {
          setSavedExperts([]);
          setErrorMessage(
            "저장한 전문가 정보를 불러오지 못했습니다. 잠시 후 다시 확인해주세요."
          );
          setLoading(false);
        }
      }
    }

    void loadFavorites();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const visibleSavedExperts = useMemo(
    () => savedExperts.filter((savedExpert) => savedExpert.expert),
    [savedExperts]
  );

  return (
    <main className="min-h-screen bg-[#F5F1E8] px-4 py-6 text-[#111111] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-[0.16em] text-[#111111]"
          >
            TRUPICK
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/mypage"
              className="rounded-full border border-[#D9CFBF] bg-white px-4 py-2 text-sm font-black text-[#0F5132] transition hover:border-[#111111]"
            >
              마이페이지
            </Link>
            <Link
              href="/experts"
              className="rounded-full bg-[#0F5132] px-4 py-2 text-sm font-black text-white transition hover:bg-[#146C43]"
            >
              전문가 둘러보기
            </Link>
          </div>
        </header>

        <section className="mt-6 rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
            Saved Experts
          </p>
          <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-[-0.03em] text-[#111111] sm:text-5xl">
                저장한 전문가
              </h1>
              <p className="mt-3 text-sm font-bold leading-6 text-[#374151]">
                상담 전 비교하고 싶은 검증 전문가를 한곳에 모았습니다.
              </p>
            </div>
            <div className="rounded-[8px] bg-[#FBFAF7] p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#374151]">
                Favorites
              </p>
              <p className="mt-2 text-4xl font-black text-[#111111]">
                {visibleSavedExperts.length}
              </p>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="mt-5 rounded-[8px] border border-[#E5E7EB] bg-white p-6 text-sm font-bold text-[#374151]">
            저장한 전문가를 불러오는 중입니다.
          </section>
        ) : null}

        {errorMessage ? (
          <section className="mt-5 rounded-[8px] bg-[#FEE2E2] p-5 text-sm font-bold text-[#9B1C1C]">
            {errorMessage}
          </section>
        ) : null}

        {!loading && !errorMessage && visibleSavedExperts.length === 0 ? (
          <section className="mt-5 rounded-[8px] border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
            <p className="text-2xl font-black text-[#111111]">
              아직 저장한 전문가가 없습니다.
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-6 text-[#374151]">
              전문가 카드의 하트 버튼을 눌러 관심 전문가를 저장해보세요.
            </p>
            <Link
              href="/experts"
              className="mt-6 inline-flex rounded-full bg-[#0F5132] px-6 py-3 text-sm font-black text-white transition hover:bg-[#146C43]"
            >
              전문가 찾기
            </Link>
          </section>
        ) : null}

        {!loading && visibleSavedExperts.length > 0 ? (
          <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleSavedExperts.map((savedExpert) => {
              const expert = savedExpert.expert;

              if (!expert) {
                return null;
              }

              return (
                <article
                  key={savedExpert.id}
                  className="overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#111111]"
                >
                  <Link href={`/experts/${expert.id}`} className="block">
                    <div className="relative aspect-[4/3] bg-[#EBE7DF]">
                      {expert.image_url ? (
                        <Image
                          src={expert.image_url}
                          alt={expert.name}
                          fill
                          unoptimized
                          sizes="(max-width: 1024px) 100vw, 33vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#E8F2EC] text-6xl font-black text-[#0F5132]">
                          {expert.name.slice(0, 1)}
                        </div>
                      )}
                      {expert.plan_type === "premium" ? (
                        <span className="absolute left-4 top-4 rounded-full bg-[#111111] px-4 py-2 text-xs font-black text-white">
                          ✓ PREMIUM
                        </span>
                      ) : null}
                    </div>
                  </Link>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/experts/${expert.id}`} className="min-w-0">
                        <h2 className="text-2xl font-black text-[#111111]">
                          {expert.name}
                        </h2>
                        <p className="mt-1 text-sm font-bold leading-6 text-[#374151]">
                          {expert.specialty}
                        </p>
                      </Link>
                      <FavoriteButton expertId={expert.id} size="compact" />
                    </div>

                    <p className="mt-4 text-sm font-extrabold text-[#111111]">
                      {expert.location}
                    </p>
                    <p className="mt-3 line-clamp-3 text-sm font-bold leading-6 text-[#4B5563]">
                      {expert.description || "검증된 전문가 프로필입니다."}
                    </p>
                    <p className="mt-5 text-xs font-black uppercase tracking-[0.12em] text-[#0F5132]">
                      Saved {formatSavedDate(savedExpert.created_at)}
                    </p>
                  </div>
                </article>
              );
            })}
          </section>
        ) : null}
      </div>
    </main>
  );
}
