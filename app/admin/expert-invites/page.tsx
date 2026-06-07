"use client";

import { useEffect, useMemo, useState } from "react";
import { getFriendlyErrorMessage } from "@/app/errorMessages";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

type InviteStatus = "new" | "contacted" | "invited" | "registered";

type ExpertInvite = {
  id: number;
  name: string;
  phone: string;
  specialty: string;
  location: string;
  link: string | null;
  message: string;
  status: InviteStatus;
  admin_memo: string | null;
  created_at: string;
};

const statusOptions: Array<{ value: InviteStatus; label: string }> = [
  { value: "new", label: "신규" },
  { value: "contacted", label: "연락 완료" },
  { value: "invited", label: "초대 완료" },
  { value: "registered", label: "등록 완료" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function getStatusLabel(status: InviteStatus) {
  return statusOptions.find((option) => option.value === status)?.label ?? status;
}

function getStatusClassName(status: InviteStatus) {
  if (status === "registered") {
    return "bg-[#E8F2EC] text-[#0F5132]";
  }

  if (status === "invited") {
    return "bg-[#EEF2FF] text-[#3730A3]";
  }

  if (status === "contacted") {
    return "bg-[#FFF4E5] text-[#875200]";
  }

  return "bg-[#F3F4F6] text-[#374151]";
}

export default function AdminExpertInvitesPage() {
  const [invites, setInvites] = useState<ExpertInvite[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InviteStatus | "all">("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [memoDrafts, setMemoDrafts] = useState<Record<number, string>>({});

  async function loadInvites() {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("expert_invites")
      .select(
        "id, name, phone, specialty, location, link, message, status, admin_memo, created_at"
      )
      .order("created_at", { ascending: false })
      .returns<ExpertInvite[]>();

    if (error) {
      setErrorMessage(getFriendlyErrorMessage(error.message));
      return;
    }

    setInvites(data || []);
    setMemoDrafts(
      (data || []).reduce<Record<number, string>>((drafts, invite) => {
        drafts[invite.id] = invite.admin_memo || "";
        return drafts;
      }, {})
    );
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadInvites();
    });
  }, []);

  const counts = useMemo(
    () => ({
      all: invites.length,
      new: invites.filter((invite) => invite.status === "new").length,
      contacted: invites.filter((invite) => invite.status === "contacted")
        .length,
      invited: invites.filter((invite) => invite.status === "invited").length,
      registered: invites.filter((invite) => invite.status === "registered")
        .length,
    }),
    [invites]
  );

  const filteredInvites = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return invites.filter((invite) => {
      const matchesStatus =
        statusFilter === "all" || invite.status === statusFilter;
      const haystack = [
        invite.name,
        invite.phone,
        invite.specialty,
        invite.location,
        invite.message,
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (keyword.length === 0 || haystack.includes(keyword));
    });
  }, [invites, search, statusFilter]);

  async function updateInvite(
    invite: ExpertInvite,
    payload: Partial<Pick<ExpertInvite, "status" | "admin_memo">>
  ) {
    const supabase = getSupabaseBrowserClient();
    setUpdatingId(invite.id);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("expert_invites")
      .update(payload)
      .eq("id", invite.id);

    setUpdatingId(null);

    if (error) {
      setErrorMessage(getFriendlyErrorMessage(error.message));
      return;
    }

    setMessage(`${invite.name} 신청 정보를 업데이트했습니다.`);
    await loadInvites();
  }

  return (
    <main className="min-h-screen bg-[#F5F1E8] px-4 py-6 text-[#111111] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
            Expert Invite Management
          </p>
          <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-end">
            <div>
              <h1 className="text-4xl font-black text-[#111111]">
                베타 전문가 초대 관리
              </h1>
              <p className="mt-3 text-sm font-bold leading-6 text-[#374151]">
                초대 신청자를 확인하고 연락, 초대, 등록 완료 상태를 관리합니다.
              </p>
            </div>
            <div className="grid grid-cols-5 gap-2">
              <Metric label="전체" value={counts.all} />
              <Metric label="신규" value={counts.new} />
              <Metric label="연락" value={counts.contacted} />
              <Metric label="초대" value={counts.invited} />
              <Metric label="등록" value={counts.registered} />
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="이름, 연락처, 분야, 지역 검색"
              className="min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
            />
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as InviteStatus | "all")
              }
              className="min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none focus:border-[#111111]"
            >
              <option value="all">전체</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {message ? (
          <section className="mt-5 rounded-[8px] bg-[#E8F2EC] p-4 text-sm font-black text-[#0F5132]">
            {message}
          </section>
        ) : null}
        {errorMessage ? (
          <section className="mt-5 rounded-[8px] bg-[#FEE2E2] p-4 text-sm font-black text-[#991B1B]">
            {errorMessage}
          </section>
        ) : null}

        <section className="mt-5 grid gap-4">
          {filteredInvites.length === 0 ? (
            <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-8 text-center text-sm font-black text-[#374151]">
              조건에 맞는 초대 신청이 없습니다.
            </div>
          ) : (
            filteredInvites.map((invite) => (
              <article
                key={invite.id}
                className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-sm"
              >
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black text-[#111111]">
                        {invite.name}
                      </h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClassName(
                          invite.status
                        )}`}
                      >
                        {getStatusLabel(invite.status)}
                      </span>
                    </div>
                    <dl className="mt-4 grid gap-3 text-sm font-bold leading-6 text-[#374151] sm:grid-cols-2">
                      <Info label="연락처" value={invite.phone} />
                      <Info label="분야" value={invite.specialty} />
                      <Info label="지역" value={invite.location} />
                      <Info label="신청일" value={formatDate(invite.created_at)} />
                    </dl>
                    <p className="mt-4 rounded-[8px] bg-[#FBFAF7] p-4 text-sm font-bold leading-7 text-[#374151]">
                      {invite.message}
                    </p>
                    <div className="mt-4 text-sm font-black">
                      {invite.link ? (
                        <a
                          href={invite.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0F5132] underline underline-offset-4"
                        >
                          링크 열기
                        </a>
                      ) : (
                        <span className="text-[#374151]">링크 없음</span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <label className="grid gap-2">
                      <span className="text-sm font-black text-[#111111]">
                        상태
                      </span>
                      <select
                        value={invite.status}
                        onChange={(event) =>
                          updateInvite(invite, {
                            status: event.target.value as InviteStatus,
                          })
                        }
                        disabled={updatingId === invite.id}
                        className="min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none focus:border-[#111111]"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-black text-[#111111]">
                        메모
                      </span>
                      <textarea
                        value={memoDrafts[invite.id] ?? ""}
                        onChange={(event) =>
                          setMemoDrafts((current) => ({
                            ...current,
                            [invite.id]: event.target.value,
                          }))
                        }
                        placeholder="연락 내용, 초대 여부, 보완 사항"
                        className="min-h-28 w-full resize-y rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 py-3 text-sm font-bold leading-6 text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        updateInvite(invite, {
                          admin_memo: memoDrafts[invite.id] ?? "",
                        })
                      }
                      disabled={updatingId === invite.id}
                      className="rounded-full bg-[#0F5132] px-5 py-3 text-sm font-black text-white transition hover:bg-[#146C43] disabled:opacity-70"
                    >
                      메모 저장
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[8px] bg-[#FBFAF7] p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#374151]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-[#111111]">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-black text-[#111111]">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
