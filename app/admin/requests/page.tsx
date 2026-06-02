"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";
import { getFriendlyErrorMessage } from "@/app/errorMessages";

type CounselingRequest = {
  id: number;
  customer_name: string;
  phone: string;
  message: string;
  expert_id: number | null;
  expert_name?: string | null;
  status: string | null;
  created_at: string;
};

type RequestStatus =
  | "all"
  | "new"
  | "contacted"
  | "in_progress"
  | "completed"
  | "canceled";

type StructuredRequestMessage = {
  version?: number;
  expert_id?: number | null;
  expert_name?: string | null;
  customer_name?: string;
  phone?: string;
  method?: string;
  goal?: string;
  problem?: string;
  desired_result?: string;
  preferred_day?: string;
  preferred_time?: string;
  additional_message?: string;
};

type RequestView = {
  request: CounselingRequest;
  structuredMessage: StructuredRequestMessage | null;
  status: Exclude<RequestStatus, "all">;
  statusLabel: string;
  customerName: string;
  phone: string;
  expertName: string;
  goal: string;
  method: string;
  preferredTime: string;
  problem: string;
  desiredResult: string;
  additionalMessage: string;
  createdAt: string;
  searchableText: string;
};

const statusFilters: Array<{ label: string; value: RequestStatus }> = [
  { label: "전체", value: "all" },
  { label: "신규", value: "new" },
  { label: "연락 완료", value: "contacted" },
  { label: "상담 진행중", value: "in_progress" },
  { label: "상담 완료", value: "completed" },
  { label: "취소", value: "canceled" },
];

const statusActions: Array<{
  label: string;
  value: Exclude<RequestStatus, "all">;
}> = [
  { label: "신규", value: "new" },
  { label: "연락 완료", value: "contacted" },
  { label: "상담 진행중", value: "in_progress" },
  { label: "상담 완료", value: "completed" },
  { label: "취소", value: "canceled" },
];

function parseRequestMessage(message: string): StructuredRequestMessage | null {
  try {
    const parsed = JSON.parse(message) as StructuredRequestMessage;

    if (typeof parsed === "object" && parsed !== null) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
}

function normalizeStatus(status: string | null): Exclude<RequestStatus, "all"> {
  if (status === "contacted") {
    return "contacted";
  }

  if (status === "in_progress" || status === "matched") {
    return "in_progress";
  }

  if (status === "completed") {
    return "completed";
  }

  if (status === "canceled" || status === "cancelled") {
    return "canceled";
  }

  return "new";
}

function getStatusLabel(status: Exclude<RequestStatus, "all">) {
  if (status === "contacted") {
    return "연락 완료";
  }

  if (status === "in_progress") {
    return "상담 진행중";
  }

  if (status === "completed") {
    return "상담 완료";
  }

  if (status === "canceled") {
    return "취소";
  }

  return "신규";
}

function getStatusClassName(status: Exclude<RequestStatus, "all">) {
  if (status === "completed") {
    return "bg-[#E8F2EC] text-[#0F5132]";
  }

  if (status === "in_progress") {
    return "bg-[#FFF4E5] text-[#875200]";
  }

  if (status === "contacted") {
    return "bg-[#EAF0FF] text-[#274690]";
  }

  if (status === "canceled") {
    return "bg-[#F3F4F6] text-[#6B7280]";
  }

  return "bg-[#111111] text-white";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRequestView(request: CounselingRequest): RequestView {
  const structuredMessage = parseRequestMessage(request.message);
  const status = normalizeStatus(request.status);
  const customerName =
    structuredMessage?.customer_name || request.customer_name || "-";
  const phone = structuredMessage?.phone || request.phone || "-";
  const expertName =
    request.expert_name || structuredMessage?.expert_name || "미지정";
  const preferredTime = [
    structuredMessage?.preferred_day,
    structuredMessage?.preferred_time,
  ]
    .filter(Boolean)
    .join(" · ");

  const view = {
    request,
    structuredMessage,
    status,
    statusLabel: getStatusLabel(status),
    customerName,
    phone,
    expertName,
    goal: structuredMessage?.goal || "-",
    method: structuredMessage?.method || "-",
    preferredTime: preferredTime || "-",
    problem: structuredMessage?.problem || request.message || "-",
    desiredResult: structuredMessage?.desired_result || "-",
    additionalMessage: structuredMessage?.additional_message || "없음",
    createdAt: formatDate(request.created_at),
    searchableText: "",
  };

  return {
    ...view,
    searchableText: [
      view.customerName,
      view.phone,
      view.expertName,
      view.goal,
      view.method,
    ]
      .join(" ")
      .toLowerCase(),
  };
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<CounselingRequest[]>([]);
  const [activeStatus, setActiveStatus] = useState<RequestStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(
    null
  );
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function refreshRequests() {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    const { data } = await supabase
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false });

    setRequests(data || []);
  }

  useEffect(() => {
    let isMounted = true;

    async function fetchRequests() {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        return;
      }

      const { data } = await supabase
        .from("requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (isMounted) {
        setRequests(data || []);
      }
    }

    void fetchRequests();

    return () => {
      isMounted = false;
    };
  }, []);

  const requestViews = useMemo(
    () => requests.map((request) => getRequestView(request)),
    [requests]
  );

  const filteredRequests = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return requestViews.filter((view) => {
      const matchesStatus =
        activeStatus === "all" || view.status === activeStatus;
      const matchesSearch =
        keyword.length === 0 || view.searchableText.includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [activeStatus, requestViews, searchQuery]);

  const selectedRequest =
    requestViews.find((view) => view.request.id === selectedRequestId) ?? null;

  async function changeStatus(
    id: number,
    status: Exclude<RequestStatus, "all">
  ) {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    setUpdatingId(id);

    const { error } = await supabase
      .from("requests")
      .update({ status })
      .eq("id", id);

    setUpdatingId(null);

    if (error) {
      alert(getFriendlyErrorMessage(error.message));
      return;
    }

    void refreshRequests();
  }

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-4 py-6 text-[#111111] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <section className="mb-5 rounded-[8px] border border-[#e2dbcf] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                Admin Requests
              </p>
              <h1 className="mt-2 text-4xl font-black">상담 요청 관리</h1>
              <p className="mt-3 text-sm font-bold leading-6 text-[#6c665d]">
                접수된 상담을 검색하고 상태별로 관리합니다.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:min-w-[420px]">
              <div className="rounded-[8px] bg-[#fbfaf7] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8a8073]">
                  Total
                </p>
                <p className="mt-2 text-2xl font-black">{requests.length}</p>
              </div>
              <div className="rounded-[8px] bg-[#fbfaf7] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8a8073]">
                  New
                </p>
                <p className="mt-2 text-2xl font-black">
                  {requestViews.filter((view) => view.status === "new").length}
                </p>
              </div>
              <div className="rounded-[8px] bg-[#fbfaf7] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8a8073]">
                  Done
                </p>
                <p className="mt-2 text-2xl font-black">
                  {
                    requestViews.filter((view) => view.status === "completed")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-5 rounded-[8px] border border-[#e2dbcf] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveStatus(filter.value)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-black transition ${
                    activeStatus === filter.value
                      ? "border-[#111111] bg-[#111111] text-white"
                      : "border-[#e2dbcf] bg-white text-[#4B5563] hover:border-[#111111]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="고객명, 전문가명, 연락처 검색"
              className="min-h-11 w-full rounded-full border border-[#e2dbcf] bg-[#fbfaf7] px-5 text-sm font-bold text-[#111111] outline-none transition placeholder:text-[#9a9489] focus:border-[#111111] lg:max-w-sm"
            />
          </div>
        </section>

        <section className="hidden overflow-hidden rounded-[8px] border border-[#e2dbcf] bg-white shadow-sm lg:block">
          <table className="w-full table-fixed border-collapse text-left">
            <thead className="bg-[#fbfaf7] text-xs font-black uppercase tracking-[0.12em] text-[#6c665d]">
              <tr>
                <th className="w-[14%] px-4 py-4">신청자</th>
                <th className="w-[13%] px-4 py-4">연락처</th>
                <th className="w-[15%] px-4 py-4">전문가명</th>
                <th className="w-[14%] px-4 py-4">상담 목적</th>
                <th className="w-[11%] px-4 py-4">방식</th>
                <th className="w-[12%] px-4 py-4">희망 시간</th>
                <th className="w-[10%] px-4 py-4">신청일</th>
                <th className="w-[11%] px-4 py-4">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#efe8dd]">
              {filteredRequests.map((view) => (
                <tr key={view.request.id} className="align-top">
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => setSelectedRequestId(view.request.id)}
                      className="text-left text-sm font-black text-[#111111] underline-offset-4 hover:underline"
                    >
                      {view.customerName}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-[#4B5563]">
                    {view.phone}
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-[#111111]">
                    {view.expertName}
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-[#4B5563]">
                    {view.goal}
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-[#4B5563]">
                    {view.method}
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-[#4B5563]">
                    {view.preferredTime}
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-[#4B5563]">
                    {view.createdAt}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${getStatusClassName(
                          view.status
                        )}`}
                      >
                        {view.statusLabel}
                      </span>
                      <select
                        value={view.status}
                        onChange={(event) =>
                          changeStatus(
                            view.request.id,
                            event.target.value as Exclude<RequestStatus, "all">
                          )
                        }
                        disabled={updatingId === view.request.id}
                        className="rounded-full border border-[#e2dbcf] bg-white px-3 py-2 text-xs font-black text-[#111111] outline-none"
                      >
                        {statusActions.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="grid gap-4 lg:hidden">
          {filteredRequests.map((view) => (
            <article
              key={view.request.id}
              className="rounded-[8px] border border-[#e2dbcf] bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black">{view.customerName}</h2>
                  <p className="mt-1 text-sm font-bold text-[#6c665d]">
                    {view.phone}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${getStatusClassName(
                    view.status
                  )}`}
                >
                  {view.statusLabel}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  ["전문가명", view.expertName],
                  ["상담 목적", view.goal],
                  ["상담 방식", view.method],
                  ["희망 시간대", view.preferredTime],
                  ["신청일", view.createdAt],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[8px] bg-[#fbfaf7] p-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#8a8073]">
                      {label}
                    </p>
                    <p className="mt-2 text-sm font-black leading-6 text-[#111111]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <select
                  value={view.status}
                  onChange={(event) =>
                    changeStatus(
                      view.request.id,
                      event.target.value as Exclude<RequestStatus, "all">
                    )
                  }
                  disabled={updatingId === view.request.id}
                  className="min-h-11 flex-1 rounded-full border border-[#e2dbcf] bg-white px-4 text-sm font-black text-[#111111]"
                >
                  {statusActions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setSelectedRequestId(view.request.id)}
                  className="min-h-11 rounded-full bg-[#111111] px-5 text-sm font-black text-white"
                >
                  상세 보기
                </button>
              </div>
            </article>
          ))}
        </section>

        {filteredRequests.length === 0 ? (
          <div className="rounded-[8px] border border-[#e2dbcf] bg-white p-8 text-center text-sm font-black text-[#6c665d]">
            조건에 맞는 상담 요청이 없습니다.
          </div>
        ) : null}
      </div>

      {selectedRequest ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-[#111111]/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-6">
          <section className="max-h-[92vh] w-full overflow-y-auto rounded-t-[8px] border border-[#e2dbcf] bg-white shadow-[0_28px_90px_rgba(24,24,20,0.18)] sm:max-w-3xl sm:rounded-[8px]">
            <div className="flex items-start justify-between gap-4 border-b border-[#efe8dd] p-5 sm:p-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                  Request Detail
                </p>
                <h2 className="mt-2 text-3xl font-black">
                  {selectedRequest.customerName}
                </h2>
                <p className="mt-2 text-sm font-bold text-[#6c665d]">
                  {selectedRequest.phone} · {selectedRequest.expertName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequestId(null)}
                className="rounded-full border border-[#e2dbcf] bg-white px-4 py-2 text-sm font-black text-[#111111]"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["상태", selectedRequest.statusLabel],
                  ["상담 방식", selectedRequest.method],
                  ["희망 시간대", selectedRequest.preferredTime],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[8px] bg-[#fbfaf7] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8a8073]">
                      {label}
                    </p>
                    <p className="mt-2 text-sm font-black leading-6 text-[#111111]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {[
                ["상담 목적", selectedRequest.goal],
                ["현재 고민", selectedRequest.problem],
                ["원하는 결과", selectedRequest.desiredResult],
                ["추가 메시지", selectedRequest.additionalMessage],
                ["전체 상담 내용", selectedRequest.request.message],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[8px] bg-[#fbfaf7] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8a8073]">
                    {label}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm font-bold leading-7 text-[#111111]">
                    {value}
                  </p>
                </div>
              ))}

              <div className="flex flex-wrap gap-2 border-t border-[#efe8dd] pt-4">
                {statusActions.map((status) => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() =>
                      changeStatus(selectedRequest.request.id, status.value)
                    }
                    disabled={updatingId === selectedRequest.request.id}
                    className={`rounded-full px-4 py-2 text-sm font-black transition ${
                      selectedRequest.status === status.value
                        ? "bg-[#111111] text-white"
                        : "border border-[#e2dbcf] bg-white text-[#111111] hover:border-[#111111]"
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
