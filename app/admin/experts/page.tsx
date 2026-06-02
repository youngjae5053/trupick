"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";
import { getFriendlyErrorMessage } from "@/app/errorMessages";

type Expert = {
  id: number;
  name: string;
  specialty: string;
  location: string;
  description: string;
  career: string | null;
  approved: boolean | null;
  plan_type?: "free" | "premium" | null;
  status?: string | null;
};

type ApprovalFilter = "all" | "pending" | "approved" | "rejected";
type ApprovalStatus = Exclude<ApprovalFilter, "all">;

const filters: Array<{ label: string; value: ApprovalFilter }> = [
  { label: "전체", value: "all" },
  { label: "승인 대기", value: "pending" },
  { label: "승인 완료", value: "approved" },
  { label: "거절", value: "rejected" },
];

function getExpertStatus(expert: Expert): ApprovalStatus {
  if (expert.status === "rejected") {
    return "rejected";
  }

  if (expert.approved) {
    return "approved";
  }

  return "pending";
}

function getStatusLabel(status: ApprovalStatus) {
  if (status === "approved") {
    return "승인 완료";
  }

  if (status === "rejected") {
    return "거절";
  }

  return "승인 대기";
}

function getStatusClassName(status: ApprovalStatus) {
  if (status === "approved") {
    return "bg-[#E8F2EC] text-[#0F5132]";
  }

  if (status === "rejected") {
    return "bg-[#FEE2E2] text-[#991B1B]";
  }

  return "bg-[#FFF4E5] text-[#875200]";
}

export default function AdminExpertsPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [activeFilter, setActiveFilter] = useState<ApprovalFilter>("pending");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function refreshExperts() {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    const { data } = await supabase
      .from("experts")
      .select("*")
      .order("id", { ascending: false });

    setExperts(data || []);
  }

  useEffect(() => {
    let isMounted = true;

    async function fetchExperts() {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        return;
      }

      const { data } = await supabase
        .from("experts")
        .select("*")
        .order("id", { ascending: false });

      if (isMounted) {
        setExperts(data || []);
      }
    }

    void fetchExperts();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleExperts = useMemo(
    () =>
      experts.filter((expert) => {
        const status = getExpertStatus(expert);

        return activeFilter === "all" || status === activeFilter;
      }),
    [activeFilter, experts]
  );

  const counts = useMemo(
    () => ({
      all: experts.length,
      pending: experts.filter((expert) => getExpertStatus(expert) === "pending")
        .length,
      approved: experts.filter((expert) => getExpertStatus(expert) === "approved")
        .length,
      rejected: experts.filter((expert) => getExpertStatus(expert) === "rejected")
        .length,
    }),
    [experts]
  );

  async function updateExpertStatus(id: number, status: ApprovalStatus) {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    setUpdatingId(id);

    const approved = status === "approved";
    const { error } = await supabase
      .from("experts")
      .update({
        approved,
        status,
      })
      .eq("id", id);

    if (error) {
      const fallback = await supabase
        .from("experts")
        .update({ approved })
        .eq("id", id);

      if (fallback.error) {
        alert(getFriendlyErrorMessage(fallback.error.message));
        setUpdatingId(null);
        return;
      }
    }

    setUpdatingId(null);
    void refreshExperts();
  }

  return (
    <main className="min-h-screen bg-[#F7F3EA] px-4 py-6 text-[#111111] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
            Admin Experts
          </p>
          <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black">전문가 승인 관리</h1>
              <p className="mt-3 text-sm font-bold leading-6 text-[#6c665d]">
                승인된 전문가만 홈과 전문가 탐색 페이지에 노출됩니다.
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:min-w-[480px]">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  className={`rounded-[8px] border p-3 text-left transition ${
                    activeFilter === filter.value
                      ? "border-[#111111] bg-[#111111] text-white"
                      : "border-[#E5E7EB] bg-[#FBFAF7] text-[#111111] hover:border-[#111111]"
                  }`}
                >
                  <span className="block text-[11px] font-black">
                    {filter.label}
                  </span>
                  <span className="mt-1 block text-2xl font-black">
                    {counts[filter.value]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4">
          {visibleExperts.map((expert) => {
            const status = getExpertStatus(expert);

            return (
              <article
                key={expert.id}
                className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black">{expert.name}</h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClassName(
                          status
                        )}`}
                      >
                        {getStatusLabel(status)}
                      </span>
                      <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-black text-[#4B5563]">
                        {expert.plan_type === "premium" ? "PREMIUM" : "FREE"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-bold text-[#4B5563]">
                      {expert.specialty} · {expert.location}
                    </p>
                    <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-[#4B5563]">
                      {expert.description}
                    </p>
                    <p className="mt-3 text-sm font-bold leading-7 text-[#6c665d]">
                      경력: {expert.career || "-"}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateExpertStatus(expert.id, "approved")}
                      disabled={updatingId === expert.id}
                      className="rounded-full bg-[#0F5132] px-5 py-3 text-sm font-black text-white disabled:opacity-45"
                    >
                      승인
                    </button>
                    <button
                      type="button"
                      onClick={() => updateExpertStatus(expert.id, "rejected")}
                      disabled={updatingId === expert.id}
                      className="rounded-full bg-[#9B1C1C] px-5 py-3 text-sm font-black text-white disabled:opacity-45"
                    >
                      거절
                    </button>
                    <button
                      type="button"
                      onClick={() => updateExpertStatus(expert.id, "pending")}
                      disabled={updatingId === expert.id}
                      className="rounded-full border border-[#E5E7EB] bg-white px-5 py-3 text-sm font-black text-[#111111] disabled:opacity-45"
                    >
                      대기 전환
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {visibleExperts.length === 0 ? (
            <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-8 text-center text-sm font-black text-[#6c665d]">
              해당 상태의 전문가가 없습니다.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
