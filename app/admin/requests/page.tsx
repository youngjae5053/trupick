"use client";

import { useEffect, useMemo, useState } from "react";
import { getFriendlyErrorMessage } from "@/app/errorMessages";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

type ConsultationRequest = {
  id: number;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  category: string;
  message: string;
  expert_id: number | null;
  status: RequestStatus;
};

type RequestStatus = "pending" | "accepted" | "rejected" | "completed";

type ExpertName = {
  id: number;
  name: string;
};

const statusFilters: Array<{ label: string; value: RequestStatus | "all" }> = [
  { label: "전체", value: "all" },
  { label: "대기중", value: "pending" },
  { label: "수락", value: "accepted" },
  { label: "거절", value: "rejected" },
  { label: "완료", value: "completed" },
];

const statusActions: Array<{ label: string; value: RequestStatus }> = [
  { label: "대기중", value: "pending" },
  { label: "수락", value: "accepted" },
  { label: "거절", value: "rejected" },
  { label: "완료", value: "completed" },
];

function getStatusLabel(status: RequestStatus) {
  if (status === "accepted") {
    return "수락";
  }

  if (status === "rejected") {
    return "거절";
  }

  if (status === "completed") {
    return "완료";
  }

  return "대기중";
}

function getStatusClassName(status: RequestStatus) {
  if (status === "accepted") {
    return "bg-[#EAF0FF] text-[#274690]";
  }

  if (status === "rejected") {
    return "bg-[#FEE2E2] text-[#991B1B]";
  }

  if (status === "completed") {
    return "bg-[#E8F2EC] text-[#0F5132]";
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

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [experts, setExperts] = useState<Record<number, string>>({});
  const [activeStatus, setActiveStatus] = useState<RequestStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(
    null
  );
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function refreshRequests() {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    const [{ data: requestRows, error }, { data: expertRows }] =
      await Promise.all([
        supabase
          .from("consultation_requests")
          .select("*")
          .order("created_at", { ascending: false })
          .returns<ConsultationRequest[]>(),
        supabase.from("experts").select("id, name").returns<ExpertName[]>(),
      ]);

    if (error) {
      setErrorMessage(getFriendlyErrorMessage(error.message));
      return;
    }

    setRequests(requestRows || []);
    setExperts(
      (expertRows || []).reduce<Record<number, string>>((map, expert) => {
        map[expert.id] = expert.name;
        return map;
      }, {})
    );
  }

  useEffect(() => {
    let isMounted = true;

    async function loadRequests() {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        return;
      }

      const [{ data: requestRows, error }, { data: expertRows }] =
        await Promise.all([
          supabase
            .from("consultation_requests")
            .select("*")
            .order("created_at", { ascending: false })
            .returns<ConsultationRequest[]>(),
          supabase.from("experts").select("id, name").returns<ExpertName[]>(),
        ]);

      if (!isMounted) {
        return;
      }

      if (error) {
        setErrorMessage(getFriendlyErrorMessage(error.message));
        return;
      }

      setRequests(requestRows || []);
      setExperts(
        (expertRows || []).reduce<Record<number, string>>((map, expert) => {
          map[expert.id] = expert.name;
          return map;
        }, {})
      );
    }

    void loadRequests();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRequests = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return requests.filter((request) => {
      const expertName = request.expert_id
        ? experts[request.expert_id] || ""
        : "";
      const matchesStatus =
        activeStatus === "all" || request.status === activeStatus;
      const matchesSearch =
        keyword.length === 0 ||
        [
          request.customer_name,
          request.customer_email,
          request.customer_phone,
          request.category,
          request.message,
          expertName,
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [activeStatus, experts, requests, searchQuery]);

  const selectedRequest =
    requests.find((request) => request.id === selectedRequestId) ?? null;

  async function changeStatus(id: number, status: RequestStatus) {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    setUpdatingId(id);

    const { error } = await supabase
      .from("consultation_requests")
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
    <main className="min-h-screen bg-[#F5F1E8] px-4 py-6 text-[#111111] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <section className="mb-5 rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
                Consultation Requests
              </p>
              <h1 className="mt-2 text-4xl font-black">상담 요청 관리</h1>
              <p className="mt-3 text-sm font-bold leading-6 text-[#374151]">
                접수된 전체 상담 신청을 조회하고 상태를 관리합니다.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:min-w-[420px]">
              <MetricCard label="Total" value={`${requests.length}`} />
              <MetricCard
                label="Pending"
                value={`${
                  requests.filter((request) => request.status === "pending")
                    .length
                }`}
              />
              <MetricCard
                label="Completed"
                value={`${
                  requests.filter((request) => request.status === "completed")
                    .length
                }`}
              />
            </div>
          </div>
        </section>

        <section className="mb-5 rounded-[8px] border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-5">
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
                      : "border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#111111]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="고객명, 이메일, 연락처, 전문가명 검색"
              className="min-h-11 w-full rounded-full border border-[#D9CFBF] bg-[#FBFAF7] px-5 text-sm font-bold text-[#111111] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#111111] lg:max-w-sm"
            />
          </div>
        </section>

        {errorMessage ? (
          <section className="mb-5 rounded-[8px] bg-[#FEE2E2] p-5 text-sm font-bold text-[#9B1C1C]">
            {errorMessage}
          </section>
        ) : null}

        <section className="hidden overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white shadow-sm lg:block">
          <table className="w-full table-fixed border-collapse text-left">
            <thead className="bg-[#FBFAF7] text-xs font-black uppercase tracking-[0.12em] text-[#6B7280]">
              <tr>
                <th className="w-[14%] px-4 py-4">신청자</th>
                <th className="w-[18%] px-4 py-4">이메일/연락처</th>
                <th className="w-[16%] px-4 py-4">전문가</th>
                <th className="w-[14%] px-4 py-4">카테고리</th>
                <th className="w-[22%] px-4 py-4">문의 내용</th>
                <th className="w-[8%] px-4 py-4">신청일</th>
                <th className="w-[8%] px-4 py-4">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE8DD]">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="align-top">
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => setSelectedRequestId(request.id)}
                      className="text-left text-sm font-black text-[#111111] underline-offset-4 hover:underline"
                    >
                      {request.customer_name}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-sm font-bold leading-6 text-[#4B5563]">
                    {request.customer_email}
                    <br />
                    {request.customer_phone}
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-[#111111]">
                    {request.expert_id
                      ? experts[request.expert_id] || `Expert #${request.expert_id}`
                      : "미지정"}
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-[#4B5563]">
                    {request.category}
                  </td>
                  <td className="px-4 py-4 text-sm font-bold leading-6 text-[#4B5563]">
                    <p className="line-clamp-3">{request.message}</p>
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-[#4B5563]">
                    {formatDate(request.created_at)}
                  </td>
                  <td className="px-4 py-4">
                    <StatusSelect
                      value={request.status}
                      disabled={updatingId === request.id}
                      onChange={(status) => changeStatus(request.id, status)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="grid gap-4 lg:hidden">
          {filteredRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              expertName={
                request.expert_id
                  ? experts[request.expert_id] || `Expert #${request.expert_id}`
                  : "미지정"
              }
              updating={updatingId === request.id}
              onStatusChange={(status) => changeStatus(request.id, status)}
              onDetail={() => setSelectedRequestId(request.id)}
            />
          ))}
        </section>

        {filteredRequests.length === 0 ? (
          <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-8 text-center text-sm font-black text-[#374151]">
            조건에 맞는 상담 요청이 없습니다.
          </div>
        ) : null}
      </div>

      {selectedRequest ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-[#111111]/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-6">
          <section className="max-h-[92vh] w-full overflow-y-auto rounded-t-[8px] border border-[#E5E7EB] bg-white shadow-[0_28px_90px_rgba(24,24,20,0.18)] sm:max-w-3xl sm:rounded-[8px]">
            <div className="flex items-start justify-between gap-4 border-b border-[#EFE8DD] p-5 sm:p-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F5132]">
                  Request Detail
                </p>
                <h2 className="mt-2 text-3xl font-black">
                  {selectedRequest.customer_name}
                </h2>
                <p className="mt-2 text-sm font-bold text-[#4B5563]">
                  {selectedRequest.customer_email} ·{" "}
                  {selectedRequest.customer_phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequestId(null)}
                className="rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-black text-[#111111]"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <DetailBlock
                  label="상태"
                  value={getStatusLabel(selectedRequest.status)}
                />
                <DetailBlock label="카테고리" value={selectedRequest.category} />
                <DetailBlock
                  label="전문가"
                  value={
                    selectedRequest.expert_id
                      ? experts[selectedRequest.expert_id] ||
                        `Expert #${selectedRequest.expert_id}`
                      : "미지정"
                  }
                />
              </div>
              <DetailBlock label="문의 내용" value={selectedRequest.message} />

              <div className="flex flex-wrap gap-2 border-t border-[#EFE8DD] pt-4">
                {statusActions.map((status) => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => changeStatus(selectedRequest.id, status.value)}
                    disabled={updatingId === selectedRequest.id}
                    className={`rounded-full px-4 py-2 text-sm font-black transition ${
                      selectedRequest.status === status.value
                        ? "bg-[#111111] text-white"
                        : "border border-[#E5E7EB] bg-white text-[#111111] hover:border-[#111111]"
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-[#FBFAF7] p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6B7280]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function StatusSelect({
  value,
  disabled,
  onChange,
}: {
  value: RequestStatus;
  disabled: boolean;
  onChange: (status: RequestStatus) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span
        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${getStatusClassName(
          value
        )}`}
      >
        {getStatusLabel(value)}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as RequestStatus)}
        disabled={disabled}
        className="rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-black text-[#111111] outline-none"
      >
        {statusActions.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RequestCard({
  request,
  expertName,
  updating,
  onStatusChange,
  onDetail,
}: {
  request: ConsultationRequest;
  expertName: string;
  updating: boolean;
  onStatusChange: (status: RequestStatus) => void;
  onDetail: () => void;
}) {
  return (
    <article className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">{request.customer_name}</h2>
          <p className="mt-1 text-sm font-bold leading-6 text-[#4B5563]">
            {request.customer_email}
            <br />
            {request.customer_phone}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${getStatusClassName(
            request.status
          )}`}
        >
          {getStatusLabel(request.status)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {[
          ["전문가", expertName],
          ["카테고리", request.category],
          ["신청일", formatDate(request.created_at)],
          ["상태", getStatusLabel(request.status)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[8px] bg-[#FBFAF7] p-3">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#6B7280]">
              {label}
            </p>
            <p className="mt-2 text-sm font-black leading-6 text-[#111111]">
              {value}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-4 line-clamp-3 text-sm font-bold leading-6 text-[#374151]">
        {request.message}
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <select
          value={request.status}
          onChange={(event) => onStatusChange(event.target.value as RequestStatus)}
          disabled={updating}
          className="min-h-11 flex-1 rounded-full border border-[#E5E7EB] bg-white px-4 text-sm font-black text-[#111111]"
        >
          {statusActions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onDetail}
          className="min-h-11 rounded-full bg-[#111111] px-5 text-sm font-black text-white"
        >
          상세 보기
        </button>
      </div>
    </article>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-[#FBFAF7] p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6B7280]">
        {label}
      </p>
      <p className="mt-3 whitespace-pre-wrap text-sm font-bold leading-7 text-[#111111]">
        {value}
      </p>
    </div>
  );
}
