"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { trackAnalyticsEvent } from "@/app/analytics";
import { getFriendlyErrorMessage } from "@/app/errorMessages";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

type UserRole = "customer" | "expert" | "admin";

const wizardSteps = [
  { id: 1, label: "Basic Info", title: "기본 정보를 입력해주세요." },
  { id: 2, label: "Expertise", title: "전문성과 경험을 알려주세요." },
  { id: 3, label: "Verification", title: "검증 자료를 추가해주세요." },
  { id: 4, label: "Philosophy", title: "전문가 철학을 들려주세요." },
  { id: 5, label: "Case Portfolio", title: "대표 사례를 정리해주세요." },
  { id: 6, label: "Preview & Submit", title: "프로필을 확인하고 제출하세요." },
];

const consultationOptions = ["방문 상담", "온라인 상담", "센터 상담"];
const verificationSteps = [
  "자격 정보 확인",
  "경력 검토",
  "프로필 품질 검수",
  "승인 후 노출",
];

const verificationPreviewItems = [
  "신원 확인 예정",
  "경력 검토 예정",
  "자격 검토 예정",
  "인터뷰 검토 예정",
  "사례 검토 예정",
];

function RegisterStatusShell({
  eyebrow,
  title,
  description,
  children,
  tone = "green",
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  tone?: "green" | "coral";
}) {
  return (
    <main className="min-h-screen bg-[#F5F1E8] px-4 py-6 text-[#111111] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-[0.16em] text-[#111111]"
          >
            TRUPICK
          </Link>
          <Link
            href="/pricing"
            className="rounded-full border border-[#D9CFBF] bg-white px-4 py-2 text-sm font-black text-[#0F5132] transition hover:border-[#111111]"
          >
            플랜 보기
          </Link>
        </header>

        <section className="grid gap-6 lg:grid-cols-[65fr_35fr] lg:items-start">
          <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8 lg:p-10">
            <p
              className={`text-sm font-black uppercase tracking-[0.2em] ${
                tone === "coral" ? "text-[#D65339]" : "text-[#0F5132]"
              }`}
            >
              {eyebrow}
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-normal text-[#111111] sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-base font-bold leading-7 text-[#374151]">
              {description}
            </p>
            {children ? <div className="mt-8">{children}</div> : null}
          </div>

          <aside className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] lg:sticky lg:top-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
              Review Process
            </p>
            <h2 className="mt-3 text-3xl font-black text-[#111111]">
              검증 안내
            </h2>
            <div className="mt-6 grid gap-4">
              {verificationSteps.map((item, index) => (
                <div key={item} className="rounded-[8px] bg-[#FBFAF7] p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F5132] text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <p className="mt-3 text-sm font-black leading-6 text-[#111111]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-black text-[#111111]">{children}</label>;
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="mt-2 min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="mt-2 w-full resize-y rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 py-3 text-sm font-bold leading-7 text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
    />
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [consultationMethods, setConsultationMethods] = useState<string[]>([]);
  const [careerYears, setCareerYears] = useState("");
  const [careerHighlights, setCareerHighlights] = useState("");
  const [confidentArea, setConfidentArea] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [certifications, setCertifications] = useState("");
  const [certificationFile, setCertificationFile] = useState<File | null>(null);
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [snsUrl, setSnsUrl] = useState("");
  const [philosophy, setPhilosophy] = useState("");
  const [promise, setPromise] = useState("");
  const [faqOne, setFaqOne] = useState("");
  const [faqTwo, setFaqTwo] = useState("");
  const [faqThree, setFaqThree] = useState("");
  const [caseTitle, setCaseTitle] = useState("");
  const [caseProblem, setCaseProblem] = useState("");
  const [caseProcess, setCaseProcess] = useState("");
  const [caseResult, setCaseResult] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const planType = "free" as const;

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user ?? null;

        if (!isMounted) {
          return;
        }

        if (!user) {
          router.replace("/login?redirect=/register");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle<{ role: UserRole }>();

        if (!isMounted) {
          return;
        }

        const role =
          profile?.role ?? (user.user_metadata?.role as UserRole | undefined);

        if (role !== "expert" && role !== "admin") {
          setAccessDenied(true);
          setCheckingAuth(false);
          return;
        }

        setCheckingAuth(false);
      } catch (error) {
        console.error(error);
        setCheckingAuth(false);
      }
    }

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!submitted) {
      return;
    }

    const redirectTimer = window.setTimeout(() => {
      router.push("/mypage");
    }, 1800);

    return () => window.clearTimeout(redirectTimer);
  }, [router, submitted]);

  const completionItems = useMemo(
    () => [
      {
        label: "Basic Info",
        complete: Boolean(
          name && location && specialty && consultationMethods.length > 0
        ),
      },
      {
        label: "Expertise",
        complete: Boolean(
          careerYears && careerHighlights && confidentArea && customerType
        ),
      },
      {
        label: "Verification",
        complete: Boolean(
          (certifications || certificationFile) && portfolioUrl && snsUrl
        ),
      },
      {
        label: "Philosophy",
        complete: Boolean(philosophy && promise && faqOne && faqTwo && faqThree),
      },
      {
        label: "Case Portfolio",
        complete: Boolean(caseTitle && caseProblem && caseProcess && caseResult),
      },
    ],
    [
      careerHighlights,
      careerYears,
      caseProblem,
      caseProcess,
      caseResult,
      caseTitle,
      certificationFile,
      certifications,
      confidentArea,
      consultationMethods.length,
      customerType,
      faqOne,
      faqThree,
      faqTwo,
      location,
      name,
      philosophy,
      portfolioUrl,
      promise,
      snsUrl,
      specialty,
    ]
  );

  const completenessScore = useMemo(() => {
    const completed = completionItems.filter((item) => item.complete).length;

    return Math.round((completed / completionItems.length) * 100);
  }, [completionItems]);

  const improvementTips = useMemo(() => {
    const tips: string[] = [];

    if (!completionItems[0].complete) {
      tips.push("기본 정보와 상담 방식을 입력하면 고객이 빠르게 판단할 수 있습니다.");
    }

    if (!completionItems[1].complete) {
      tips.push("경력과 잘 맞는 고객 유형을 입력하면 전문성이 더 선명해집니다.");
    }

    if (!completionItems[2].complete) {
      tips.push("자격증/증빙 자료를 추가하면 검증 가능성이 높아집니다.");
    }

    if (!completionItems[3].complete) {
      tips.push("전문가 철학과 Q&A를 입력하면 상담 전 신뢰도가 높아집니다.");
    }

    if (!completionItems[4].complete) {
      tips.push("대표 사례를 입력하면 신뢰도가 높아집니다.");
    }

    return tips;
  }, [completionItems]);

  function toggleConsultationMethod(method: string) {
    setConsultationMethods((current) =>
      current.includes(method)
        ? current.filter((item) => item !== method)
        : [...current, method]
    );
  }

  function resetForm() {
    setCurrentStep(1);
    setName("");
    setLocation("");
    setSpecialty("");
    setConsultationMethods([]);
    setCareerYears("");
    setCareerHighlights("");
    setConfidentArea("");
    setCustomerType("");
    setCertifications("");
    setCertificationFile(null);
    setPortfolioUrl("");
    setSnsUrl("");
    setPhilosophy("");
    setPromise("");
    setFaqOne("");
    setFaqTwo("");
    setFaqThree("");
    setCaseTitle("");
    setCaseProblem("");
    setCaseProcess("");
    setCaseResult("");
  }

  function validateStep(step = currentStep) {
    if (
      step === 1 &&
      (!name.trim() ||
        !location.trim() ||
        !specialty.trim() ||
        consultationMethods.length === 0)
    ) {
      alert("이름, 활동 지역, 세부 분야, 상담 방식을 입력해주세요.");
      return false;
    }

    if (
      step === 2 &&
      (!careerYears.trim() ||
        !careerHighlights.trim() ||
        !confidentArea.trim() ||
        !customerType.trim())
    ) {
      alert("경력 년수, 주요 경력, 자신 있는 분야, 고객 유형을 입력해주세요.");
      return false;
    }

    if (
      step === 3 &&
      ((!certifications.trim() && !certificationFile) ||
        !portfolioUrl.trim() ||
        !snsUrl.trim())
    ) {
      alert("자격증/증빙 자료, 포트폴리오 링크, SNS/웹사이트 링크를 입력해주세요.");
      return false;
    }

    if (
      step === 4 &&
      (!philosophy.trim() ||
        !promise.trim() ||
        !faqOne.trim() ||
        !faqTwo.trim() ||
        !faqThree.trim())
    ) {
      alert("전문가 철학, 고객 약속, 자주 받는 질문 3개를 입력해주세요.");
      return false;
    }

    if (
      step === 5 &&
      (!caseTitle.trim() ||
        !caseProblem.trim() ||
        !caseProcess.trim() ||
        !caseResult.trim())
    ) {
      alert("대표 사례 제목, 고객 문제, 진행 과정, 결과를 모두 입력해주세요.");
      return false;
    }

    return true;
  }

  function goNext() {
    if (!validateStep()) {
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, wizardSteps.length));
  }

  function goBack() {
    setCurrentStep((step) => Math.max(step - 1, 1));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    for (let step = 1; step <= 5; step += 1) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        return;
      }
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: userData } = await supabase.auth.getUser();

      const certificationItems = certifications
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (certificationFile) {
        certificationItems.push(`증빙 파일: ${certificationFile.name}`);
      }

      const career = [
        `경력 년수: ${careerYears.trim()}`,
        `주요 경력: ${careerHighlights.trim()}`,
        `가장 자신 있는 분야: ${confidentArea.trim()}`,
        `잘 맞는 고객 유형: ${customerType.trim()}`,
      ].join("\n\n");

      const description = [
        "상담 방식",
        consultationMethods.join(", "),
        "",
        "전문가 철학",
        philosophy.trim(),
        "",
        "고객에게 약속하는 것",
        promise.trim(),
        "",
        "자주 받는 질문",
        `1. ${faqOne.trim()}`,
        `2. ${faqTwo.trim()}`,
        `3. ${faqThree.trim()}`,
        "",
        "대표 사례",
        `제목: ${caseTitle.trim()}`,
        `고객 문제: ${caseProblem.trim()}`,
        `진행 과정: ${caseProcess.trim()}`,
        `결과: ${caseResult.trim()}`,
      ].join("\n");

      const { error: submitError } = await supabase.from("experts").insert([
        {
          name: name.trim(),
          specialty: specialty.trim(),
          location: location.trim(),
          description,
          career,
          certifications: certificationItems,
          portfolio_url: portfolioUrl.trim(),
          sns_url: snsUrl.trim(),
          image_url: null,
          plan_type: planType,
          approved: false,
          approval_status: "pending",
          status: "pending",
          user_id: userData.user?.id ?? null,
        },
      ]);

      if (submitError) {
        console.error(submitError);
        alert(getFriendlyErrorMessage(submitError.message));
        return;
      }

      void trackAnalyticsEvent({
        eventName: "expert_register",
        page: "/register",
        metadata: {
          plan_type: planType,
          specialty: specialty.trim(),
          location: location.trim(),
          consultation_methods: consultationMethods.join(", "),
        },
      });
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      alert("전문가 등록 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  }

  if (checkingAuth) {
    return (
      <RegisterStatusShell
        eyebrow="Checking Session"
        title="로그인 상태를 확인하고 있습니다."
        description="전문가 등록은 로그인한 사용자만 이용할 수 있습니다."
      />
    );
  }

  if (accessDenied) {
    return (
      <RegisterStatusShell
        eyebrow="Expert Only"
        title="전문가 회원만 등록 가능합니다"
        description="현재 계정은 고객 회원입니다. 전문가 등록이 필요하다면 전문가 계정으로 가입하거나 관리자에게 권한 변경을 요청해주세요."
        tone="coral"
      >
        <div className="flex flex-wrap gap-3">
          <Link
            href="/experts"
            className="rounded-full bg-[#111111] px-6 py-3 text-sm font-black text-white transition hover:bg-[#0F5132]"
          >
            전문가 둘러보기
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-[#E5E7EB] bg-white px-6 py-3 text-sm font-black text-[#111111] transition hover:border-[#111111]"
          >
            전문가 계정 만들기
          </Link>
        </div>
      </RegisterStatusShell>
    );
  }

  if (submitted) {
    return (
      <RegisterStatusShell
        eyebrow="Registration Submitted"
        title="검증 신청이 접수되었습니다."
        description="TRUPICK 팀이 검토 후 승인 여부를 안내드립니다. 잠시 후 마이페이지로 이동합니다."
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0F5132] text-xl font-black text-white">
          ✓
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/mypage"
            className="rounded-full bg-[#111111] px-6 py-3 text-sm font-black text-white transition hover:bg-[#0F5132]"
          >
            마이페이지로 이동
          </Link>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              resetForm();
            }}
            className="rounded-full border border-[#E5E7EB] bg-white px-6 py-3 text-sm font-black text-[#111111] transition hover:border-[#111111]"
          >
            추가 등록
          </button>
        </div>
      </RegisterStatusShell>
    );
  }

  const activeStep = wizardSteps[currentStep - 1];

  return (
    <main className="min-h-screen bg-[#F5F1E8] px-4 py-6 text-[#111111] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-[0.16em] text-[#111111]"
          >
            TRUPICK
          </Link>
          <Link
            href="/pricing"
            className="rounded-full border border-[#D9CFBF] bg-white px-4 py-2 text-sm font-black text-[#0F5132]"
          >
            플랜 보기
          </Link>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8 lg:p-10">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#0F5132]">
              Expert Host Wizard
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.03em] text-[#111111] sm:text-5xl">
              단계별로 검증 전문가 프로필을 완성하세요.
            </h1>
            <p className="mt-4 max-w-2xl text-base font-bold leading-7 text-[#374151]">
              에어비앤비 호스트 등록처럼 필요한 정보를 순서대로 입력합니다.
              진행 상태는 유지되며, 제출 전 프로필 미리보기를 확인할 수
              있습니다.
            </p>

            <div className="mt-8 grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
              {wizardSteps.map((step) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`rounded-[8px] border p-3 text-left transition ${
                    currentStep === step.id
                      ? "border-[#0F5132] bg-[#E8F2EC]"
                      : "border-[#E5E7EB] bg-[#FBFAF7]"
                  }`}
                >
                  <span className="text-xs font-black text-[#0F5132]">
                    {step.id}
                  </span>
                  <span className="mt-1 block text-xs font-black leading-5 text-[#111111]">
                    {step.label}
                  </span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-8">
              <div className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-5 sm:p-6">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
                  Step {activeStep.id}
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#111111]">
                  {activeStep.title}
                </h2>

                {currentStep === 1 ? (
                  <div className="mt-6 grid gap-5">
                    <div>
                      <FieldLabel>이름</FieldLabel>
                      <TextInput
                        value={name}
                        onChange={setName}
                        placeholder="김영재"
                      />
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <FieldLabel>활동 지역</FieldLabel>
                        <TextInput
                          value={location}
                          onChange={setLocation}
                          placeholder="서울 강남구"
                        />
                      </div>
                      <div>
                        <FieldLabel>세부 분야</FieldLabel>
                        <TextInput
                          value={specialty}
                          onChange={setSpecialty}
                          placeholder="재활운동 · 통증관리"
                        />
                      </div>
                    </div>
                    <section>
                      <FieldLabel>상담 방식</FieldLabel>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        {consultationOptions.map((method) => {
                          const selected = consultationMethods.includes(method);

                          return (
                            <button
                              key={method}
                              type="button"
                              onClick={() => toggleConsultationMethod(method)}
                              className={`rounded-[8px] border p-4 text-left text-sm font-black transition hover:-translate-y-0.5 ${
                                selected
                                  ? "border-[#0F5132] bg-white text-[#0F5132]"
                                  : "border-[#D9CFBF] bg-white text-[#111111]"
                              }`}
                            >
                              {method}
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                ) : null}

                {currentStep === 2 ? (
                  <div className="mt-6 grid gap-5">
                    <div>
                      <FieldLabel>경력 년수</FieldLabel>
                      <TextInput
                        value={careerYears}
                        onChange={setCareerYears}
                        placeholder="예: 8년"
                      />
                    </div>
                    <div>
                      <FieldLabel>주요 경력</FieldLabel>
                      <TextArea
                        value={careerHighlights}
                        onChange={setCareerHighlights}
                        placeholder="근무 센터, 지도 경험, 주요 프로젝트를 입력해주세요."
                      />
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <FieldLabel>가장 자신 있는 분야</FieldLabel>
                        <TextInput
                          value={confidentArea}
                          onChange={setConfidentArea}
                          placeholder="예: 허리 통증 관리"
                        />
                      </div>
                      <div>
                        <FieldLabel>잘 맞는 고객 유형</FieldLabel>
                        <TextInput
                          value={customerType}
                          onChange={setCustomerType}
                          placeholder="예: 운동을 처음 시작하는 직장인"
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                {currentStep === 3 ? (
                  <div className="mt-6 grid gap-5">
                    <div>
                      <FieldLabel>자격증/증빙 자료</FieldLabel>
                      <TextArea
                        value={certifications}
                        onChange={setCertifications}
                        placeholder="생활스포츠지도사, 건강운동관리사 등 쉼표로 구분해 입력해주세요."
                        rows={4}
                      />
                    </div>
                    <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed border-[#D9CFBF] bg-white px-4 py-6 text-center transition hover:border-[#111111]">
                      <span className="text-sm font-black text-[#111111]">
                        증빙 파일 업로드
                      </span>
                      <span className="mt-2 text-xs font-bold text-[#374151]">
                        {certificationFile
                          ? certificationFile.name
                          : "PDF, JPG, PNG 파일을 선택해주세요"}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="sr-only"
                        onChange={(event) => {
                          if (event.target.files) {
                            setCertificationFile(event.target.files[0]);
                          }
                        }}
                      />
                    </label>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <FieldLabel>포트폴리오 링크</FieldLabel>
                        <TextInput
                          value={portfolioUrl}
                          onChange={setPortfolioUrl}
                          placeholder="https://portfolio.example.com"
                          type="url"
                        />
                      </div>
                      <div>
                        <FieldLabel>SNS/웹사이트 링크</FieldLabel>
                        <TextInput
                          value={snsUrl}
                          onChange={setSnsUrl}
                          placeholder="https://instagram.com/trupick"
                          type="url"
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                {currentStep === 4 ? (
                  <div className="mt-6 grid gap-5">
                    <div>
                      <FieldLabel>전문가 철학</FieldLabel>
                      <TextArea
                        value={philosophy}
                        onChange={setPhilosophy}
                        placeholder="좋은 전문가는 고객이 자신의 몸과 선택을 이해하도록 돕는 사람이라고 생각합니다."
                        rows={5}
                      />
                    </div>
                    <div>
                      <FieldLabel>고객에게 약속하는 것</FieldLabel>
                      <TextArea
                        value={promise}
                        onChange={setPromise}
                        placeholder="무리한 운동보다 안전한 변화와 지속 가능한 루틴을 약속합니다."
                        rows={4}
                      />
                    </div>
                    <div className="grid gap-4">
                      <FieldLabel>자주 받는 질문 3개</FieldLabel>
                      <TextInput
                        value={faqOne}
                        onChange={setFaqOne}
                        placeholder="예: 통증이 있어도 운동을 시작할 수 있나요?"
                      />
                      <TextInput
                        value={faqTwo}
                        onChange={setFaqTwo}
                        placeholder="예: 상담은 몇 회 정도 받아야 하나요?"
                      />
                      <TextInput
                        value={faqThree}
                        onChange={setFaqThree}
                        placeholder="예: 집에서도 할 수 있는 루틴을 받을 수 있나요?"
                      />
                    </div>
                  </div>
                ) : null}

                {currentStep === 5 ? (
                  <div className="mt-6 grid gap-5">
                    <div>
                      <FieldLabel>대표 사례 제목</FieldLabel>
                      <TextInput
                        value={caseTitle}
                        onChange={setCaseTitle}
                        placeholder="예: 8주 허리 통증 개선 케이스"
                      />
                    </div>
                    <div>
                      <FieldLabel>고객 문제</FieldLabel>
                      <TextArea
                        value={caseProblem}
                        onChange={setCaseProblem}
                        placeholder="고객이 어떤 문제를 갖고 있었나요?"
                        rows={3}
                      />
                    </div>
                    <div>
                      <FieldLabel>진행 과정</FieldLabel>
                      <TextArea
                        value={caseProcess}
                        onChange={setCaseProcess}
                        placeholder="어떤 방식으로 해결 과정을 설계했나요?"
                        rows={3}
                      />
                    </div>
                    <div>
                      <FieldLabel>결과</FieldLabel>
                      <TextArea
                        value={caseResult}
                        onChange={setCaseResult}
                        placeholder="어떤 변화나 결과가 있었나요?"
                        rows={3}
                      />
                    </div>
                  </div>
                ) : null}

                {currentStep === 6 ? (
                  <div className="mt-6 grid gap-5">
                    <article className="overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white shadow-[0_18px_55px_rgba(24,24,20,0.08)]">
                      <div className="bg-[#111111] p-5 text-white sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#B7E3C9]">
                              Profile Card Preview
                            </p>
                            <h3 className="mt-3 text-3xl font-black">
                              {name || "전문가 이름"}
                            </h3>
                            <p className="mt-2 text-sm font-bold leading-6 text-white/80">
                              {specialty || "세부 분야"} · {location || "활동 지역"}
                            </p>
                          </div>
                          <span className="w-fit rounded-full bg-white px-4 py-2 text-xs font-black text-[#0F5132]">
                            승인 대기
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-px bg-[#E5E7EB] md:grid-cols-2">
                        {[
                          ["상담 방식", consultationMethods.join(", ")],
                          ["경력", `${careerYears} · ${careerHighlights}`],
                          ["전문가 철학", philosophy],
                          ["대표 사례", `${caseTitle} - ${caseResult}`],
                          [
                            "자격/증빙 정보",
                            certifications || certificationFile?.name || "",
                          ],
                          ["SNS/포트폴리오 링크", `${snsUrl} ${portfolioUrl}`],
                        ].map(([label, value]) => (
                          <div key={label} className="bg-white p-5">
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0F5132]">
                              {label}
                            </p>
                            <p className="mt-2 text-sm font-bold leading-6 text-[#374151]">
                              {value || "입력 대기"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </article>

                    <section className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                      <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-5">
                        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#0F5132]">
                          Profile Completeness
                        </p>
                        <p className="mt-4 text-6xl font-black tracking-[-0.05em] text-[#111111]">
                          {completenessScore}
                          <span className="text-2xl">점</span>
                        </p>
                        <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#E5E7EB]">
                          <div
                            className="h-full rounded-full bg-[#0F5132]"
                            style={{ width: `${completenessScore}%` }}
                          />
                        </div>
                        <div className="mt-5 grid gap-2">
                          {completionItems.map((item) => (
                            <div
                              key={item.label}
                              className="flex items-center justify-between rounded-[8px] bg-[#FBFAF7] p-3"
                            >
                              <span className="text-xs font-black text-[#111111]">
                                {item.label}
                              </span>
                              <span className="text-xs font-black text-[#0F5132]">
                                {item.complete ? "20점" : "0점"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-5">
                        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#0F5132]">
                          부족한 항목 안내
                        </p>
                        <div className="mt-4 grid gap-3">
                          {improvementTips.length > 0 ? (
                            improvementTips.map((tip) => (
                              <p
                                key={tip}
                                className="rounded-[8px] bg-[#FFF7ED] p-4 text-sm font-bold leading-6 text-[#9A3412]"
                              >
                                {tip}
                              </p>
                            ))
                          ) : (
                            <p className="rounded-[8px] bg-[#E8F2EC] p-4 text-sm font-bold leading-6 text-[#0F5132]">
                              모든 핵심 항목이 입력되었습니다. 제출 전 내용을 한 번만 더 확인해주세요.
                            </p>
                          )}
                        </div>
                      </div>
                    </section>

                    <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-5">
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-[#0F5132]">
                        TRUPICK Verification Preview
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {verificationPreviewItems.map((item, index) => (
                          <div
                            key={item}
                            className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-4"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111111] text-xs font-black text-white">
                              {index + 1}
                            </span>
                            <p className="mt-3 text-sm font-black leading-6 text-[#111111]">
                              {item}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-5">
                      <h3 className="text-2xl font-black text-[#111111]">
                        제출하면 승인 대기 상태로 저장됩니다.
                      </h3>
                      <p className="mt-3 text-sm font-bold leading-6 text-[#374151]">
                        `approved=false`, `approval_status=pending`으로 저장되고,
                        TRUPICK 팀 검토 후 승인 여부가 안내됩니다.
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="rounded-full bg-[#0F5132] px-6 py-4 text-sm font-black text-white shadow-[0_14px_34px_rgba(15,81,50,0.18)] transition hover:-translate-y-0.5 hover:bg-[#146C43]"
                    >
                      검증 신청 제출
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={currentStep === 1}
                  className="rounded-full border border-[#D9CFBF] bg-white px-6 py-3 text-sm font-black text-[#111111] transition hover:border-[#111111] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  이전
                </button>
                {currentStep < wizardSteps.length ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="rounded-full bg-[#111111] px-6 py-3 text-sm font-black text-white transition hover:bg-[#0F5132]"
                  >
                    다음
                  </button>
                ) : null}
              </div>
            </form>
          </div>

          <aside className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] lg:sticky lg:top-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
              Wizard Status
            </p>
            <h2 className="mt-3 text-3xl font-black text-[#111111]">
              {completenessScore}% Complete
            </h2>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#E5E7EB]">
              <div
                className="h-full rounded-full bg-[#0F5132] transition-all"
                style={{ width: `${completenessScore}%` }}
              />
            </div>

            <div className="mt-5 grid gap-2">
              {completionItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 rounded-[8px] bg-[#FBFAF7] p-3"
                >
                  <span className="text-sm font-black text-[#111111]">
                    {item.label}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      item.complete
                        ? "bg-[#E8F2EC] text-[#0F5132]"
                        : "bg-[#F3F4F6] text-[#374151]"
                    }`}
                  >
                    {item.complete ? "저장됨" : "대기"}
                  </span>
                </div>
              ))}
            </div>

            <section className="mt-5 rounded-[8px] bg-[#FBFAF7] p-4">
              <h3 className="text-base font-black text-[#111111]">
                검증 안내
              </h3>
              <ul className="mt-3 grid gap-2 text-sm font-bold leading-6 text-[#374151]">
                {verificationSteps.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
