"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getFriendlyErrorMessage } from "@/app/errorMessages";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

export default function InviteExpertPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [location, setLocation] = useState("");
  const [link, setLink] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (
      !name.trim() ||
      !phone.trim() ||
      !specialty.trim() ||
      !location.trim() ||
      !message.trim()
    ) {
      setErrorMessage("이름, 연락처, 전문 분야, 활동 지역, 자기소개를 입력해주세요.");
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      setSubmitting(true);

      const { error } = await supabase.from("expert_invites").insert([
        {
          name: name.trim(),
          phone: phone.trim(),
          specialty: specialty.trim(),
          location: location.trim(),
          link: link.trim() || null,
          message: message.trim(),
          status: "new",
        },
      ]);

      setSubmitting(false);

      if (error) {
        setErrorMessage(getFriendlyErrorMessage(error.message));
        return;
      }

      setSubmitted(true);
    } catch (error) {
      console.error(error);
      setSubmitting(false);
      setErrorMessage("신청을 접수하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  }

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
              href="/become-expert"
              className="rounded-full border border-[#D9CFBF] bg-white px-4 py-2 text-sm font-black text-[#0F5132] transition hover:border-[#111111]"
            >
              전문가 모집 안내
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-[#111111] px-4 py-2 text-sm font-black text-white transition hover:bg-[#0F5132]"
            >
              등록 시작
            </Link>
          </div>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8">
            {submitted ? (
              <div className="py-14 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0F5132] text-2xl font-black text-white">
                  ✓
                </div>
                <h1 className="mt-6 text-4xl font-black text-[#111111]">
                  베타 전문가 신청이 접수되었습니다.
                </h1>
                <p className="mx-auto mt-4 max-w-md text-sm font-bold leading-7 text-[#374151]">
                  TRUPICK 팀이 검토 후 초대 가능 여부를 안내드릴게요.
                </p>
                <Link
                  href="/become-expert"
                  className="mt-7 inline-flex rounded-full bg-[#0F5132] px-6 py-3 text-sm font-black text-white transition hover:bg-[#146C43]"
                >
                  모집 안내로 돌아가기
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
                  Beta Expert Invitation
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-[-0.03em] text-[#111111] sm:text-5xl">
                  TRUPICK 베타 전문가 초대 신청
                </h1>
                <p className="mt-4 text-sm font-bold leading-7 text-[#374151]">
                  현재 베타는 초대 기반으로 운영됩니다. 운동/재활 분야에서
                  전문성과 사례를 가진 전문가를 우선 검토합니다.
                </p>

                <form onSubmit={submitInvite} className="mt-7 grid gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <InviteInput
                      label="이름"
                      value={name}
                      onChange={setName}
                      placeholder="김영재"
                    />
                    <InviteInput
                      label="연락처"
                      value={phone}
                      onChange={setPhone}
                      placeholder="010-0000-0000"
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <InviteInput
                      label="전문 분야"
                      value={specialty}
                      onChange={setSpecialty}
                      placeholder="재활운동 · 통증관리"
                    />
                    <InviteInput
                      label="활동 지역"
                      value={location}
                      onChange={setLocation}
                      placeholder="서울 강남구"
                    />
                  </div>

                  <InviteInput
                    label="인스타그램/포트폴리오 링크"
                    value={link}
                    onChange={setLink}
                    placeholder="https://instagram.com/trupick"
                    type="url"
                  />

                  <label className="grid gap-2">
                    <span className="text-sm font-black text-[#111111]">
                      간단한 자기소개
                    </span>
                    <textarea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder="전문 분야, 주요 고객, 대표 사례를 간단히 소개해주세요."
                      className="min-h-36 w-full resize-y rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 py-3 text-sm font-bold leading-7 text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
                    />
                  </label>

                  {errorMessage ? (
                    <p className="rounded-[8px] bg-[#FEE2E2] p-4 text-sm font-bold text-[#991B1B]">
                      {errorMessage}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-[#0F5132] px-6 py-4 text-sm font-black text-white shadow-[0_14px_34px_rgba(15,81,50,0.18)] transition hover:-translate-y-0.5 hover:bg-[#146C43] disabled:opacity-70"
                  >
                    {submitting ? "접수 중..." : "베타 전문가 신청하기"}
                  </button>
                </form>
              </>
            )}
          </div>

          <aside className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] lg:sticky lg:top-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
              Invite Only
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em]">
              초대받은 전문가만 먼저 함께합니다.
            </h2>
            <div className="mt-6 grid gap-3 text-sm font-bold leading-7 text-[#374151]">
              <p className="rounded-[8px] bg-[#FBFAF7] p-4">
                베타 기간에는 운동/재활 전문가를 중심으로 제한적으로 모집합니다.
              </p>
              <p className="rounded-[8px] bg-[#FBFAF7] p-4">
                신청 내용을 검토한 뒤 적합한 전문가에게 등록 링크와 다음 절차를
                안내합니다.
              </p>
              <p className="rounded-[8px] bg-[#FBFAF7] p-4">
                저가 경쟁이 아니라 전문성, 사례, 신뢰를 보여줄 수 있는 전문가를
                우선 소개합니다.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function InviteInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#111111]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
      />
    </label>
  );
}
