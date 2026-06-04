"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";
import { getFriendlyErrorMessage } from "@/app/errorMessages";

type ApprovalFilter = "all" | "pending" | "approved" | "rejected";
type ApprovalStatus = Exclude<ApprovalFilter, "all">;

type Expert = {
  id: number;
  name: string;
  specialty: string;
  location: string;
  description: string;
  career: string | null;
  approved: boolean | null;
  image_url?: string | null;
  plan_type?: "free" | "premium" | null;
  status?: string | null;
  approval_status?: string | null;
  certifications?: string[] | string | null;
  portfolio_url?: string | null;
  sns_url?: string | null;
};

const filters: Array<{ label: string; value: ApprovalFilter }> = [
  { label: "전체", value: "all" },
  { label: "승인대기", value: "pending" },
  { label: "승인완료", value: "approved" },
  { label: "거절", value: "rejected" },
];

const fallbackImage =
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80";

function getExpertStatus(expert: Expert): ApprovalStatus {
  if (
    expert.approval_status === "rejected" ||
    expert.status === "rejected"
  ) {
    return "rejected";
  }

  if (
    expert.approved === true &&
    (expert.approval_status === "approved" || expert.status === "approved")
  ) {
    return "approved";
  }

  return "pending";
}

function getStatusLabel(status: ApprovalStatus) {
  if (status === "approved") {
    return "Approved";
  }

  if (status === "rejected") {
    return "Rejected";
  }

  return "Pending";
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

function getCertifications(certifications: Expert["certifications"]) {
  if (Array.isArray(certifications)) {
    return certifications.filter(Boolean);
  }

  if (typeof certifications === "string") {
    return certifications
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function renderLink(url: string | null | undefined, label: string) {
  if (!url) {
    return <span className="text-[#374151]">-</span>;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="font-black text-[#0F5132] underline underline-offset-4"
    >
      {label}
    </a>
  );
}

export default function AdminExpertsPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [activeFilter, setActiveFilter] = useState<ApprovalFilter>("pending");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);

  async function refreshExperts() {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    const { data, error } = await supabase
      .from("experts")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      alert(getFriendlyErrorMessage(error.message));
      return;
    }

    setExperts(data || []);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadExperts() {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        return;
      }

      const { data, error } = await supabase
        .from("experts")
        .select("*")
        .order("id", { ascending: false });

      if (!isMounted) {
        return;
      }

      if (error) {
        alert(getFriendlyErrorMessage(error.message));
        return;
      }

      setExperts(data || []);
    }

    void loadExperts();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const visibleExperts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return experts.filter((expert) => {
      const status = getExpertStatus(expert);
      const matchesFilter = activeFilter === "all" || status === activeFilter;
      const matchesSearch =
        keyword.length === 0 || expert.name.toLowerCase().includes(keyword);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, experts, search]);

  async function writeApprovalAnalytics(expert: Expert, status: ApprovalStatus) {
    if (status === "pending") {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    const eventName =
      status === "approved" ? "expert_approved" : "expert_rejected";
    const { data } = await supabase.auth.getUser();

    await supabase.from("analytics_events").insert([
      {
        user_id: data.user?.id ?? null,
        event_name: eventName,
        page: "/admin/experts",
        metadata: {
          event_type: eventName,
          expert_id: expert.id,
          expert_name: expert.name,
          status,
        },
      },
    ]);
  }

  async function updateExpertStatus(expert: Expert, status: ApprovalStatus) {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    setUpdatingId(expert.id);

    const approved = status === "approved";
    const payload = {
      approved,
      approval_status: status,
      status,
    };

    const { error } = await supabase
      .from("experts")
      .update(payload)
      .eq("id", expert.id);

    if (error) {
      const fallback = await supabase
        .from("experts")
        .update({ approved, status })
        .eq("id", expert.id);

      if (fallback.error) {
        const approvedOnly = await supabase
          .from("experts")
          .update({ approved })
          .eq("id", expert.id);

        if (approvedOnly.error) {
          alert(getFriendlyErrorMessage(approvedOnly.error.message));
          setUpdatingId(null);
          return;
        }
      }
    }

    await writeApprovalAnalytics(expert, status);
    setUpdatingId(null);
    setSelectedExpert(null);
    await refreshExperts();
  }

  async function updatePlanType(expert: Expert, planType: "free" | "premium") {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    setUpdatingId(expert.id);

    const { error } = await supabase
      .from("experts")
      .update({ plan_type: planType })
      .eq("id", expert.id);

    setUpdatingId(null);

    if (error) {
      alert(getFriendlyErrorMessage(error.message));
      return;
    }

    setExperts((current) =>
      current.map((item) =>
        item.id === expert.id ? { ...item, plan_type: planType } : item
      )
    );
    setSelectedExpert((current) =>
      current && current.id === expert.id
        ? { ...current, plan_type: planType }
        : current
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F1E8] px-4 py-6 text-[#111111] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
            Expert Verification
          </p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-end">
            <div>
              <h1 className="text-4xl font-black text-[#111111]">
                전문가 승인 관리
              </h1>
              <p className="mt-3 text-sm font-bold leading-6 text-[#374151]">
                제출된 정보를 검토하고 승인된 전문가만 서비스에 노출하세요.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(["pending", "approved", "rejected"] as ApprovalStatus[]).map(
                (status) => (
                  <div
                    key={status}
                    className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-4"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#374151]">
                      {getStatusLabel(status)}
                    </p>
                    <p className="mt-2 text-3xl font-black text-[#111111]">
                      {counts[status]}명
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="mt-7 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="이름으로 검색"
              className="min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
            />
            <div className="grid grid-cols-4 gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  className={`rounded-[8px] border px-3 py-3 text-sm font-black transition ${
                    activeFilter === filter.value
                      ? "border-[#111111] bg-[#111111] text-white"
                      : "border-[#E5E7EB] bg-white text-[#111111] hover:border-[#111111]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4">
          {visibleExperts.map((expert) => {
            const status = getExpertStatus(expert);
            const certifications = getCertifications(expert.certifications);

            return (
              <article
                key={expert.id}
                className="rounded-[8px] border border-[#E5E7EB] bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_55px_rgba(24,24,20,0.08)] sm:p-5"
              >
                <div className="grid gap-5 lg:grid-cols-[140px_minmax(0,1fr)_auto] lg:items-start">
                  <div className="h-36 overflow-hidden rounded-[8px] bg-[#E5E7EB] lg:h-40">
                    <Image
                      src={expert.image_url || fallbackImage}
                      alt={expert.name}
                      width={280}
                      height={320}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black text-[#111111]">
                        {expert.name}
                      </h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClassName(
                          status
                        )}`}
                      >
                        {getStatusLabel(status)}
                      </span>
                      <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-black text-[#374151]">
                        {expert.plan_type === "premium" ? "PREMIUM" : "FREE"}
                      </span>
                    </div>

                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#D9CFBF] bg-white px-3 py-2">
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-[#374151]">
                        Plan
                      </span>
                      <select
                        value={expert.plan_type === "premium" ? "premium" : "free"}
                        onChange={(event) =>
                          updatePlanType(
                            expert,
                            event.target.value as "free" | "premium"
                          )
                        }
                        disabled={updatingId === expert.id}
                        className="bg-transparent text-sm font-black text-[#111111] outline-none"
                      >
                        <option value="free">free</option>
                        <option value="premium">premium</option>
                      </select>
                    </div>

                    <dl className="mt-4 grid gap-3 text-sm font-bold leading-6 text-[#374151] sm:grid-cols-2">
                      <div>
                        <dt className="font-black text-[#111111]">전문 분야</dt>
                        <dd>{expert.specialty}</dd>
                      </div>
                      <div>
                        <dt className="font-black text-[#111111]">지역</dt>
                        <dd>{expert.location}</dd>
                      </div>
                      <div>
                        <dt className="font-black text-[#111111]">경력</dt>
                        <dd>{expert.career || "-"}</dd>
                      </div>
                      <div>
                        <dt className="font-black text-[#111111]">자격증</dt>
                        <dd>
                          {certifications.length > 0
                            ? certifications.join(", ")
                            : "-"}
                        </dd>
                      </div>
                    </dl>

                    <p className="mt-4 line-clamp-3 text-sm font-bold leading-7 text-[#374151]">
                      {expert.description || "소개가 입력되지 않았습니다."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3 text-sm">
                      {renderLink(expert.portfolio_url, "포트폴리오")}
                      {renderLink(expert.sns_url, "SNS")}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 lg:w-[180px] lg:flex-col">
                    <button
                      type="button"
                      onClick={() => setSelectedExpert(expert)}
                      className="rounded-full border border-[#D9CFBF] bg-white px-5 py-3 text-sm font-black text-[#111111] transition hover:border-[#111111]"
                    >
                      상세 검토
                    </button>
                    <button
                      type="button"
                      onClick={() => updateExpertStatus(expert, "approved")}
                      disabled={updatingId === expert.id}
                      className="rounded-full bg-[#0F5132] px-5 py-3 text-sm font-black text-white transition hover:bg-[#146C43] disabled:opacity-70"
                    >
                      승인
                    </button>
                    <button
                      type="button"
                      onClick={() => updateExpertStatus(expert, "rejected")}
                      disabled={updatingId === expert.id}
                      className="rounded-full bg-[#9B1C1C] px-5 py-3 text-sm font-black text-white transition hover:bg-[#7F1D1D] disabled:opacity-70"
                    >
                      거절
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {visibleExperts.length === 0 ? (
            <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-8 text-center text-sm font-black text-[#374151]">
              조건에 맞는 전문가 신청이 없습니다.
            </div>
          ) : null}
        </section>
      </div>

      {selectedExpert ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 px-4 py-6">
          <div className="mx-auto max-w-5xl rounded-[8px] bg-white shadow-[0_28px_90px_rgba(0,0,0,0.24)]">
            <div className="grid gap-0 lg:grid-cols-[360px_minmax(0,1fr)]">
              <div className="min-h-80 overflow-hidden rounded-t-[8px] bg-[#E5E7EB] lg:rounded-l-[8px] lg:rounded-tr-none">
                <Image
                  src={selectedExpert.image_url || fallbackImage}
                  alt={selectedExpert.name}
                  width={720}
                  height={720}
                  unoptimized
                  className="h-full min-h-80 w-full object-cover"
                />
              </div>
              <div className="p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
                      Detailed Review
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-[#111111]">
                      {selectedExpert.name}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedExpert(null)}
                    className="rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-black text-[#111111] transition hover:border-[#111111]"
                  >
                    닫기
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClassName(
                      getExpertStatus(selectedExpert)
                    )}`}
                  >
                    {getStatusLabel(getExpertStatus(selectedExpert))}
                  </span>
                  <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-black text-[#374151]">
                    {selectedExpert.plan_type === "premium" ? "PREMIUM" : "FREE"}
                  </span>
                </div>

                <div className="mt-5 rounded-[8px] border border-[#D9CFBF] bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#374151]">
                    Plan Type
                  </p>
                  <select
                    value={
                      selectedExpert.plan_type === "premium" ? "premium" : "free"
                    }
                    onChange={(event) =>
                      updatePlanType(
                        selectedExpert,
                        event.target.value as "free" | "premium"
                      )
                    }
                    disabled={updatingId === selectedExpert.id}
                    className="mt-2 min-h-11 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-black text-[#111111] outline-none"
                  >
                    <option value="free">Free Plan</option>
                    <option value="premium">Premium Plan</option>
                  </select>
                </div>

                <dl className="mt-6 grid gap-4 text-sm font-bold leading-7 text-[#374151] sm:grid-cols-2">
                  {[
                    ["전문 분야", selectedExpert.specialty],
                    ["지역", selectedExpert.location],
                    ["경력", selectedExpert.career || "-"],
                    [
                      "자격증",
                      getCertifications(selectedExpert.certifications).join(", ") ||
                        "-",
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[8px] bg-[#FBFAF7] p-4">
                      <dt className="font-black text-[#111111]">{label}</dt>
                      <dd className="mt-1">{value}</dd>
                    </div>
                  ))}
                </dl>

                <section className="mt-4 rounded-[8px] bg-[#FBFAF7] p-4">
                  <h3 className="text-base font-black text-[#111111]">
                    자기소개
                  </h3>
                  <p className="mt-3 text-sm font-bold leading-7 text-[#374151]">
                    {selectedExpert.description || "-"}
                  </p>
                </section>

                <section className="mt-4 rounded-[8px] bg-[#FBFAF7] p-4">
                  <h3 className="text-base font-black text-[#111111]">링크</h3>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    {renderLink(selectedExpert.portfolio_url, "포트폴리오 열기")}
                    {renderLink(selectedExpert.sns_url, "SNS 열기")}
                  </div>
                </section>

                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateExpertStatus(selectedExpert, "approved")}
                    disabled={updatingId === selectedExpert.id}
                    className="rounded-full bg-[#0F5132] px-6 py-3 text-sm font-black text-white transition hover:bg-[#146C43] disabled:opacity-70"
                  >
                    승인
                  </button>
                  <button
                    type="button"
                    onClick={() => updateExpertStatus(selectedExpert, "rejected")}
                    disabled={updatingId === selectedExpert.id}
                    className="rounded-full bg-[#9B1C1C] px-6 py-3 text-sm font-black text-white transition hover:bg-[#7F1D1D] disabled:opacity-70"
                  >
                    거절
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
