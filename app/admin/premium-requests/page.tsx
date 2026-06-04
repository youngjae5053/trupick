"use client";

import { useEffect, useMemo, useState } from "react";
import { getFriendlyErrorMessage } from "@/app/errorMessages";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

type PremiumRequest = {
  id: number;
  expert_id: number | null;
  user_id: string | null;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

const statusOptions: Array<{
  label: string;
  value: PremiumRequest["status"] | "all";
}> = [
  { label: "전체", value: "all" },
  { label: "대기", value: "pending" },
  { label: "승인", value: "approved" },
  { label: "거절", value: "rejected" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusLabel(status: PremiumRequest["status"]) {
  if (status === "approved") {
    return "승인";
  }

  if (status === "rejected") {
    return "거절";
  }

  return "대기";
}

function getStatusClassName(status: PremiumRequest["status"]) {
  if (status === "approved") {
    return "bg-[#E8F2EC] text-[#0F5132]";
  }

  if (status === "rejected") {
    return "bg-[#FEE2E2] text-[#991B1B]";
  }

  return "bg-[#111111] text-white";
}

export default function AdminPremiumRequestsPage() {
  const [requests, setRequests] = useState<PremiumRequest[]>([]);
  const [activeStatus, setActiveStatus] =
    useState<PremiumRequest["status"] | "all">("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function refreshRequests() {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    const { data, error } = await supabase
      .from("premium_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<PremiumRequest[]>();

    if (error) {
      setErrorMessage(getFriendlyErrorMessage(error.message));
      return;
    }

    setRequests(data || []);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadRequests() {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        return;
      }

      const { data, error } = await supabase
        .from("premium_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .returns<PremiumRequest[]>();

      if (!isMounted) {
        return;
      }

      if (error) {
        setErrorMessage(getFriendlyErrorMessage(error.message));
        return;
      }

      setRequests(data || []);
    }

    void loadRequests();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus =
        activeStatus === "all" || request.status === activeStatus;
      const matchesSearch =
        keyword.length === 0 ||
        [
          request.name,
          request.email,
          request.phone,
          request.message,
          request.expert_id ? `expert ${request.expert_id}` : "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [activeStatus, requests, search]);

  async function updateStatus(
    request: PremiumRequest,
    status: PremiumRequest["status"]
  ) {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    setUpdatingId(request.id);

    const { error } = await supabase
      .from("premium_requests")
      .update({ status })
      .eq("id", request.id);

    if (error) {
      setUpdatingId(null);
      alert(getFriendlyErrorMessage(error.message));
      return;
    }

    if (status === "approved" && request.expert_id) {
      const { error: expertError } = await supabase
        .from("experts")
        .update({ plan_type: "premium" })
        .eq("id", request.expert_id);

      if (expertError) {
        setUpdatingId(null);
        alert(getFriendlyErrorMessage(expertError.message));
        return;
      }
    }

    setUpdatingId(null);
    void refreshRequests();
  }

  return (
    <main className="min-h-screen bg-[#F5F1E8] px-4 py-6 text-[#111111] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
            Premium Requests
          </p>
          <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
            <div>
              <h1 className="text-4xl font-black text-[#111111]">
                Premium 신청 관리
              </h1>
              <p className="mt-3 text-sm font-bold leading-6 text-[#374151]">
                Premium 신청 내역을 확인하고 승인 시 전문가 플랜을 premium으로 변경합니다.
              </p>
            </div>
            <div className="rounded-[8px] bg-[#FBFAF7] p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#374151]">
                Total
              </p>
              <p className="mt-2 text-4xl font-black text-[#111111]">
                {requests.length}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="이름, 이메일, 연락처, 메모 검색"
              className="min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
            />
            <select
              value={activeStatus}
              onChange={(event) =>
                setActiveStatus(
                  event.target.value as PremiumRequest["status"] | "all"
                )
              }
              className="min-h-12 rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-black text-[#111111] outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {errorMessage ? (
          <section className="mt-5 rounded-[8px] bg-[#FEE2E2] p-5 text-sm font-bold text-[#9B1C1C]">
            {errorMessage}
          </section>
        ) : null}

        <section className="mt-5 grid gap-4">
          {filteredRequests.length === 0 ? (
            <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-8 text-center text-sm font-black text-[#374151]">
              확인할 Premium 신청이 없습니다.
            </div>
          ) : (
            filteredRequests.map((request) => (
              <article
                key={request.id}
                className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black text-[#111111]">
                        {request.name}
                      </h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClassName(
                          request.status
                        )}`}
                      >
                        {getStatusLabel(request.status)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-bold leading-6 text-[#374151]">
                      {request.email} · {request.phone} ·{" "}
                      {formatDate(request.created_at)}
                    </p>
                    <p className="mt-2 text-sm font-bold text-[#4B5563]">
                      전문가 ID: {request.expert_id ?? "미연결"}
                    </p>
                    <div className="mt-4 rounded-[8px] bg-[#FBFAF7] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0F5132]">
                        메모
                      </p>
                      <p className="mt-3 whitespace-pre-wrap text-sm font-bold leading-7 text-[#111111]">
                        {request.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 lg:w-[180px] lg:flex-col">
                    <button
                      type="button"
                      onClick={() => updateStatus(request, "approved")}
                      disabled={updatingId === request.id}
                      className="rounded-full bg-[#0F5132] px-5 py-3 text-sm font-black text-white transition hover:bg-[#146C43] disabled:opacity-70"
                    >
                      승인
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(request, "rejected")}
                      disabled={updatingId === request.id}
                      className="rounded-full bg-[#9B1C1C] px-5 py-3 text-sm font-black text-white transition hover:bg-[#7F1D1D] disabled:opacity-70"
                    >
                      거절
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
