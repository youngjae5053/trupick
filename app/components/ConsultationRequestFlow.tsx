"use client";

import { useMemo, useState } from "react";
import { trackAnalyticsEvent } from "@/app/analytics";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";
import { getFriendlyErrorMessage } from "@/app/errorMessages";

type RequestFlowVariant = "modal" | "embedded";

type ConsultationMethod = "Online" | "Visit" | "Center";

type FormState = {
  name: string;
  email: string;
  phone: string;
  method: ConsultationMethod;
  goal: string;
  problem: string;
  desiredResult: string;
  preferredDay: string;
  preferredTime: string;
  additionalMessage: string;
};

const initialForm: FormState = {
  name: "",
  email: "",
  phone: "",
  method: "Online",
  goal: "",
  problem: "",
  desiredResult: "",
  preferredDay: "",
  preferredTime: "",
  additionalMessage: "",
};

const stepLabels = ["Basic Info", "Goal & Problem", "Schedule", "Summary"];
const methods: ConsultationMethod[] = ["Online", "Visit", "Center"];
const preferredDays = ["월", "화", "수", "목", "금", "토", "일"];
const preferredTimes = ["오전", "오후", "저녁", "상관없음"];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-sm font-black text-[#111111]">
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="mt-2 min-h-12 w-full rounded-[8px] border border-[#ded8ce] bg-[#fbfaf7] px-4 text-sm font-bold text-[#111111] outline-none transition placeholder:text-[#9a9489] focus:border-[#111111]"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="mt-2 min-h-28 w-full resize-y rounded-[8px] border border-[#ded8ce] bg-[#fbfaf7] px-4 py-3 text-sm font-bold leading-6 text-[#111111] outline-none transition placeholder:text-[#9a9489] focus:border-[#111111]"
    />
  );
}

export default function ConsultationRequestFlow({
  expertId,
  expertName,
  variant = "modal",
  triggerClassName,
  triggerLabel = "Request Consultation",
}: {
  expertId?: number | null;
  expertName?: string;
  variant?: RequestFlowVariant;
  triggerClassName?: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(variant === "embedded");
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canGoNext = useMemo(() => {
    if (step === 0) {
      return (
        form.name.trim().length > 0 &&
        form.email.includes("@") &&
        form.phone.trim().length > 0
      );
    }

    if (step === 1) {
      return (
        form.goal.trim().length > 0 &&
        form.problem.trim().length > 0 &&
        form.desiredResult.trim().length > 0
      );
    }

    if (step === 2) {
      return (
        form.preferredDay.trim().length > 0 &&
        form.preferredTime.trim().length > 0
      );
    }

    return true;
  }, [form, step]);

  function updateForm<Key extends keyof FormState>(
    key: Key,
    value: FormState[Key]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitRequest() {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      alert("상담 요청 저장 설정을 확인하는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setSubmitting(true);

    const { data: userData } = await supabase.auth.getUser();

    const structuredMessage = {
      version: 1,
      expert_id: expertId ?? null,
      expert_name: expertName || null,
      customer_name: form.name,
      customer_email: form.email,
      phone: form.phone,
      method: form.method,
      goal: form.goal,
      problem: form.problem,
      desired_result: form.desiredResult,
      preferred_day: form.preferredDay,
      preferred_time: form.preferredTime,
      additional_message: form.additionalMessage,
    };

    const simpleMessage = [
      `상담 목적: ${form.goal}`,
      `현재 고민: ${form.problem}`,
      `원하는 결과: ${form.desiredResult}`,
      `희망 일정: ${form.preferredDay} · ${form.preferredTime}`,
      `상담 방식: ${form.method}`,
      form.additionalMessage ? `추가 메시지: ${form.additionalMessage}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const serviceRequestPayload = {
      customer_name: form.name,
      customer_email: form.email,
      customer_phone: form.phone,
      category: form.goal || "상담 신청",
      message: simpleMessage,
      expert_id: expertId ?? null,
      status: "pending",
    };

    const { error: serviceError } = await supabase
      .from("consultation_requests")
      .insert([serviceRequestPayload]);

    const requestPayload = {
      customer_name: form.name,
      phone: form.phone,
      message: JSON.stringify(structuredMessage),
      expert_id: expertId ?? null,
      user_id: userData.user?.id ?? null,
      status: "pending",
    };

    const { error } = await supabase
      .from("requests")
      .insert([
        {
          ...requestPayload,
          expert_name: expertName || null,
        },
      ]);

    const shouldRetryWithoutExpertName =
      error &&
      (error.message.includes("expert_name") ||
        error.message.includes("user_id") ||
        error.message.includes("status") ||
        error.message.includes("schema cache"));

    const retryResult = shouldRetryWithoutExpertName
      ? await supabase.from("requests").insert([
          {
            customer_name: form.name,
            phone: form.phone,
            message: JSON.stringify(structuredMessage),
            expert_id: expertId ?? null,
          },
        ])
      : null;

    const submitError = serviceError ?? retryResult?.error ?? error;

    setSubmitting(false);

    if (submitError && !shouldRetryWithoutExpertName) {
      alert(getFriendlyErrorMessage(submitError.message));
      return;
    }

    if (retryResult?.error) {
      alert(getFriendlyErrorMessage(retryResult.error.message));
      return;
    }

    void trackAnalyticsEvent({
      eventName: "consultation_request",
      page: expertId ? `/experts/${expertId}` : "/request",
      metadata: {
        expert_id: expertId ?? null,
        expert_name: expertName || null,
        method: form.method,
      },
    });

    setSubmitted(true);
  }

  function resetAndClose() {
    setOpen(false);
    setStep(0);
    setForm(initialForm);
    setSubmitted(false);
  }

  const content = (
    <div className="w-full rounded-t-[8px] border border-[#ded8ce] bg-white shadow-[0_24px_80px_rgba(24,24,20,0.16)] sm:rounded-[8px]">
      <div className="border-b border-[#ede6db] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
              Request Consultation
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#111111] sm:text-3xl">
              상담 신청
            </h2>
            <p className="mt-2 text-sm font-bold leading-6 text-[#6c665d]">
              {expertName
                ? `${expertName} 전문가에게 필요한 정보를 빠르게 전달합니다.`
                : "전문가에게 필요한 정보를 빠르게 전달합니다."}
            </p>
          </div>
          {variant === "modal" ? (
            <button
              type="button"
              onClick={resetAndClose}
              className="shrink-0 rounded-full border border-[#ded8ce] bg-white px-3 py-2 text-sm font-black text-[#111111]"
            >
              Close
            </button>
          ) : null}
        </div>

        {!submitted ? (
          <div className="mt-5 grid grid-cols-4 gap-2">
            {stepLabels.map((label, index) => (
              <div key={label}>
                <div
                  className={`h-1.5 rounded-full ${
                    index <= step ? "bg-[#111111]" : "bg-[#ede6db]"
                  }`}
                />
                <p className="mt-2 hidden text-[11px] font-black text-[#6c665d] sm:block">
                  {label}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="p-5 sm:p-6">
        {submitted ? (
          <div className="rounded-[8px] bg-[#f7f3ea] p-5 text-center sm:p-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0f3d2e] text-xl font-black text-white">
              ✓
            </div>
            <h3 className="mt-5 text-2xl font-black text-[#111111] sm:text-3xl">
              상담 신청이 완료되었습니다
            </h3>
            <p className="mt-3 text-base font-bold leading-7 text-[#5b675f]">
              Request Submitted · 전문가 확인 후 연락드릴게요.
            </p>
            <button
              type="button"
              onClick={variant === "modal" ? resetAndClose : undefined}
              className="mt-6 w-full rounded-full bg-[#111111] px-6 py-3 text-sm font-black text-white sm:w-auto"
            >
              확인
            </button>
          </div>
        ) : (
          <>
            {step === 0 ? (
              <div className="grid gap-5">
                <div>
                  <FieldLabel>이름</FieldLabel>
                  <TextInput
                    value={form.name}
                    onChange={(value) => updateForm("name", value)}
                    placeholder="이름을 입력해주세요"
                  />
                </div>
                <div>
                  <FieldLabel>이메일</FieldLabel>
                  <TextInput
                    value={form.email}
                    onChange={(value) => updateForm("email", value)}
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <FieldLabel>연락처</FieldLabel>
                  <TextInput
                    value={form.phone}
                    onChange={(value) => updateForm("phone", value)}
                    placeholder="010-0000-0000"
                  />
                </div>
                <div>
                  <FieldLabel>상담 방식</FieldLabel>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {methods.map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => updateForm("method", method)}
                        className={`rounded-[8px] border px-3 py-3 text-sm font-black transition ${
                          form.method === method
                            ? "border-[#111111] bg-[#111111] text-white"
                            : "border-[#ded8ce] bg-[#fbfaf7] text-[#111111]"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-5">
                <div>
                  <FieldLabel>상담 목적</FieldLabel>
                  <TextInput
                    value={form.goal}
                    onChange={(value) => updateForm("goal", value)}
                    placeholder="예: 체형교정, 절세 상담, 계약 검토"
                  />
                </div>
                <div>
                  <FieldLabel>현재 고민</FieldLabel>
                  <TextArea
                    value={form.problem}
                    onChange={(value) => updateForm("problem", value)}
                    placeholder="현재 가장 해결하고 싶은 문제를 알려주세요"
                  />
                </div>
                <div>
                  <FieldLabel>원하는 결과</FieldLabel>
                  <TextArea
                    value={form.desiredResult}
                    onChange={(value) => updateForm("desiredResult", value)}
                    placeholder="상담 후 얻고 싶은 결과를 적어주세요"
                  />
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-5">
                <div>
                  <FieldLabel>희망 요일</FieldLabel>
                  <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {preferredDays.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => updateForm("preferredDay", day)}
                        className={`rounded-[8px] border px-3 py-3 text-sm font-black ${
                          form.preferredDay === day
                            ? "border-[#111111] bg-[#111111] text-white"
                            : "border-[#ded8ce] bg-[#fbfaf7] text-[#111111]"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <FieldLabel>희망 시간대</FieldLabel>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {preferredTimes.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => updateForm("preferredTime", time)}
                        className={`rounded-[8px] border px-3 py-3 text-sm font-black ${
                          form.preferredTime === time
                            ? "border-[#111111] bg-[#111111] text-white"
                            : "border-[#ded8ce] bg-[#fbfaf7] text-[#111111]"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <FieldLabel>추가 메시지</FieldLabel>
                  <TextArea
                    value={form.additionalMessage}
                    onChange={(value) => updateForm("additionalMessage", value)}
                    placeholder="전문가에게 미리 전달하고 싶은 내용을 적어주세요"
                  />
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid gap-3">
                {[
                  ["이름", form.name],
                  ["이메일", form.email],
                  ["연락처", form.phone],
                  ["상담 방식", form.method],
                  ["상담 목적", form.goal],
                  ["현재 고민", form.problem],
                  ["원하는 결과", form.desiredResult],
                  ["희망 일정", `${form.preferredDay} · ${form.preferredTime}`],
                  ["추가 메시지", form.additionalMessage || "없음"],
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
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(0, current - 1))}
                disabled={step === 0}
                className="w-full rounded-full border border-[#ded8ce] bg-white px-5 py-3 text-sm font-black text-[#111111] disabled:cursor-not-allowed disabled:opacity-35 sm:w-auto"
              >
                Back
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep((current) => current + 1)}
                  disabled={!canGoNext}
                  className="w-full rounded-full bg-[#111111] px-6 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-35 sm:w-auto"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitRequest}
                  disabled={submitting}
                  className="w-full rounded-full bg-[#0f3d2e] px-6 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (variant === "embedded") {
    return content;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          triggerClassName ||
          "rounded-full bg-white px-5 py-4 text-center text-sm font-black text-[#111111] transition hover:bg-[#f7f3ea]"
        }
      >
        {triggerLabel}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-[#111111]/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-6">
          <div className="max-h-[92vh] w-full overflow-y-auto sm:max-w-2xl">
            {content}
          </div>
        </div>
      ) : null}
    </>
  );
}
