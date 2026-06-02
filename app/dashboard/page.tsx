"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getNearbyExperts } from "@/app/experts/expertDiscoveryData";
import {
  getProfileCompleteness,
  ProfileCompletenessInput,
} from "@/app/profileCompleteness";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

type DashboardExpert = ProfileCompletenessInput & {
  id: number;
  name: string;
  specialty: string;
  plan_type?: "free" | "premium" | null;
};

export default function ExpertDashboardPage() {
  const [expert, setExpert] = useState<DashboardExpert | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadExpert() {
      const supabase = getSupabaseBrowserClient();

      if (supabase) {
        const { data } = await supabase
          .from("experts")
          .select("id, name, specialty, location, description, career, image_url, plan_type")
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle<DashboardExpert>();

        if (isMounted && data) {
          setExpert(data);
          return;
        }
      }

      const [mockExpert] = await getNearbyExperts();

      if (isMounted && mockExpert) {
        setExpert({
          id: mockExpert.id,
          name: mockExpert.nickname,
          specialty: mockExpert.profession,
          location: mockExpert.location,
          description: mockExpert.description,
          career: mockExpert.career,
          photoUrl: mockExpert.photoUrl,
          certifications: mockExpert.certifications,
          consultation_methods: mockExpert.consultationMethods,
          sns_url: mockExpert.snsUrl,
          portfolio_url: mockExpert.portfolioUrl,
          plan_type: mockExpert.planType,
        });
      }
    }

    void loadExpert();

    return () => {
      isMounted = false;
    };
  }, []);

  const completeness = useMemo(
    () => getProfileCompleteness(expert || {}),
    [expert]
  );

  return (
    <main className="min-h-screen bg-[#F5F1E8] px-4 py-6 text-[#111111] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-5 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-lg font-extrabold tracking-[0.18em] text-[#111111]"
          >
            TRUPICK
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-[#111111] px-5 py-3 text-sm font-black text-white"
          >
            프로필 수정
          </Link>
        </header>

        <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
            Expert Dashboard
          </p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-normal">
                {expert?.name || "전문가 프로필"}
              </h1>
              <p className="mt-3 text-base font-bold leading-7 text-[#4B5563]">
                {expert?.specialty || "프로필 정보를 불러오는 중입니다."}
              </p>
            </div>
            <div className="rounded-[8px] bg-[#FBFAF7] p-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8a8073]">
                Profile Completeness
              </p>
              <p className="mt-2 text-5xl font-black">{completeness.score}%</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
                <div
                  className="h-full rounded-full bg-[#0F5132]"
                  style={{ width: `${completeness.score}%` }}
                />
              </div>
            </div>
          </div>

          {completeness.score < 100 ? (
            <div className="mt-6 rounded-[8px] bg-[#FFF4E5] p-4 text-sm font-bold leading-7 text-[#875200]">
              {completeness.suggestions[0] ||
                "프로필 정보를 보강하면 추천 노출 가능성이 높아집니다."}
            </div>
          ) : (
            <div className="mt-6 rounded-[8px] bg-[#E8F2EC] p-4 text-sm font-bold leading-7 text-[#0F5132]">
              프로필이 100% 완성되었습니다. COMPLETE PROFILE 배지 조건을 충족합니다.
            </div>
          )}
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2">
          {completeness.items.map((item) => (
            <article
              key={item.key}
              className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-black">{item.label}</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    item.complete
                      ? "bg-[#E8F2EC] text-[#0F5132]"
                      : "bg-[#F3F4F6] text-[#6B7280]"
                  }`}
                >
                  {item.complete ? "완료" : "필요"}
                </span>
              </div>
              {!item.complete ? (
                <p className="mt-3 text-sm font-bold leading-6 text-[#4B5563]">
                  {item.suggestion}
                </p>
              ) : null}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
