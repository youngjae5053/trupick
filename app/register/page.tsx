"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { trackAnalyticsEvent } from "@/app/analytics";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";
import { getFriendlyErrorMessage } from "@/app/errorMessages";

type UserRole = "customer" | "expert" | "admin";

const verificationSteps = [
  "자격 정보 확인",
  "경력 검토",
  "프로필 품질 검수",
  "승인 후 노출",
];

const completenessItems: Array<{
  key: "photo" | "description" | "career" | "certifications" | "portfolio";
  label: string;
}> = [
  { key: "photo", label: "프로필 사진" },
  { key: "description", label: "소개" },
  { key: "career", label: "경력" },
  { key: "certifications", label: "자격증" },
  { key: "portfolio", label: "포트폴리오" },
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
            href="/free-vs-premium"
            className="rounded-full border border-[#D9CFBF] bg-white px-4 py-2 text-sm font-black text-[#0F5132] transition hover:border-[#111111]"
          >
            플랜 비교
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

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [career, setCareer] = useState("");
  const [certifications, setCertifications] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [planType, setPlanType] = useState<"free" | "premium" | "">("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        setCheckingAuth(false);
        return;
      }

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
    }

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const completenessChecks = useMemo(
    () => ({
      photo: imageUrlInput.trim().length > 0 || Boolean(imageFile),
      description: description.trim().length > 0,
      career: career.trim().length > 0,
      certifications: certifications.trim().length > 0,
      portfolio: portfolioUrl.trim().length > 0,
    }),
    [career, certifications, description, imageFile, imageUrlInput, portfolioUrl]
  );

  const completenessScore = useMemo(() => {
    const completed = Object.values(completenessChecks).filter(Boolean).length;

    return Math.round((completed / completenessItems.length) * 100);
  }, [completenessChecks]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      alert("서비스 연결 설정을 확인하는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    if (name.trim().length === 0) {
      alert("이름을 입력해주세요.");
      return;
    }

    if (specialty.trim().length === 0) {
      alert("전문 분야를 입력해주세요.");
      return;
    }

    if (location.trim().length === 0) {
      alert("활동 지역을 입력해주세요.");
      return;
    }

    if (description.trim().length === 0) {
      alert("소개를 입력해주세요.");
      return;
    }

    if (!planType) {
      alert("플랜을 선택해주세요.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    let imageUrl = imageUrlInput.trim();

    if (imageFile) {
      const fileName = `${Date.now()}-${imageFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("experts")
        .upload(fileName, imageFile);

      if (uploadError) {
        alert(getFriendlyErrorMessage(uploadError.message));
        return;
      }

      const { data } = supabase.storage
        .from("experts")
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    const expertPayload = {
      name,
      specialty,
      location,
      description,
      career,
      certifications: certifications
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      portfolio_url: portfolioUrl.trim() || null,
      sns_url: socialUrl.trim() || null,
      image_url: imageUrl,
      approved: false,
      user_id: userData.user?.id ?? null,
    };

    const { error: submitError } = await supabase.from("experts").insert([
      {
        ...expertPayload,
        plan_type: planType,
        approved: false,
        approval_status: "pending",
        status: "pending",
      },
    ]);

    if (submitError) {
      console.error(submitError);
      alert(getFriendlyErrorMessage(submitError.message));
    } else {
      void trackAnalyticsEvent({
        eventName: "expert_register",
        page: "/register",
        metadata: {
          plan_type: planType,
          specialty: specialty.trim(),
          location: location.trim(),
        },
      });
      setSubmitted(true);
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
        description="관리자 승인 후 전문가 목록에 노출됩니다."
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0F5132] text-xl font-black text-white">
          ✓
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full bg-[#111111] px-6 py-3 text-sm font-black text-white transition hover:bg-[#0F5132]"
          >
            홈으로
          </Link>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setName("");
              setSpecialty("");
              setLocation("");
              setDescription("");
              setCareer("");
              setCertifications("");
              setPortfolioUrl("");
              setSocialUrl("");
              setImageUrlInput("");
              setPlanType("");
              setImageFile(null);
            }}
            className="rounded-full border border-[#E5E7EB] bg-white px-6 py-3 text-sm font-black text-[#111111] transition hover:border-[#111111]"
          >
            추가 등록
          </button>
        </div>
      </RegisterStatusShell>
    );
  }

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
            href="/free-vs-premium"
            className="rounded-full border border-[#D9CFBF] bg-white px-4 py-2 text-sm font-black text-[#0F5132]"
          >
            플랜 비교
          </Link>
        </header>

        <section className="grid gap-6 lg:grid-cols-[65fr_35fr] lg:items-start">
          <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#0F5132]">
              Professional Registration
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-normal text-[#111111] sm:text-5xl">
              검증 전문가 신청
            </h1>
            <p className="mt-4 text-base font-bold leading-7 text-[#374151]">
              작성한 정보는 관리자 검토 후 승인된 전문가만 공개됩니다.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-black text-[#111111]">이름</label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="김영재"
                    className="mt-2 min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
                  />
                </div>
                <div>
                  <label className="text-sm font-black text-[#111111]">
                    전문 분야
                  </label>
                  <input
                    value={specialty}
                    onChange={(event) => setSpecialty(event.target.value)}
                    placeholder="스포츠 재활 트레이너"
                    className="mt-2 min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-black text-[#111111]">
                  활동 지역
                </label>
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="서울 강남구"
                  className="mt-2 min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="text-sm font-black text-[#111111]">소개</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="전문 분야, 상담 방식, 고객에게 제공할 수 있는 가치를 소개해주세요."
                  className="mt-2 min-h-32 w-full resize-y rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 py-3 text-sm font-bold leading-7 text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="text-sm font-black text-[#111111]">
                  경력 <span className="text-[#374151]">선택</span>
                </label>
                <textarea
                  value={career}
                  onChange={(event) => setCareer(event.target.value)}
                  placeholder="주요 경력, 자격증, 프로젝트 경험을 적어주세요."
                  className="mt-2 min-h-28 w-full resize-y rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 py-3 text-sm font-bold leading-7 text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="text-sm font-black text-[#111111]">
                  자격증/면허
                </label>
                <textarea
                  value={certifications}
                  onChange={(event) => setCertifications(event.target.value)}
                  placeholder="생활스포츠지도사, 건강운동관리사, 세무사 등 쉼표로 구분해 입력해주세요."
                  className="mt-2 min-h-24 w-full resize-y rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 py-3 text-sm font-bold leading-7 text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-black text-[#111111]">
                    포트폴리오 링크
                  </label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(event) => setPortfolioUrl(event.target.value)}
                    placeholder="https://portfolio.example.com"
                    className="mt-2 min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
                  />
                </div>
                <div>
                  <label className="text-sm font-black text-[#111111]">
                    인스타그램 또는 웹사이트 링크
                  </label>
                  <input
                    type="url"
                    value={socialUrl}
                    onChange={(event) => setSocialUrl(event.target.value)}
                    placeholder="https://instagram.com/trupick"
                    className="mt-2 min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
                  />
                </div>
              </div>

              <section className="rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] p-4">
                <p className="text-sm font-black text-[#111111]">
                  프로필 이미지 URL
                </p>
                <input
                  value={imageUrlInput}
                  onChange={(event) => setImageUrlInput(event.target.value)}
                  placeholder="https://example.com/profile.jpg"
                  className="mt-3 min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-white px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
                />
                <label className="mt-3 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed border-[#D9CFBF] bg-white px-4 py-5 text-center transition hover:border-[#111111]">
                  <span className="text-sm font-black text-[#111111]">
                    또는 이미지 파일 업로드
                  </span>
                  <span className="mt-1 text-xs font-bold text-[#374151]">
                    {imageFile ? imageFile.name : "JPG, PNG 파일을 선택해주세요"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      if (event.target.files) {
                        setImageFile(event.target.files[0]);
                      }
                    }}
                  />
                </label>
              </section>

              <section className="rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] p-4">
                <p className="text-sm font-black text-[#111111]">
                  검증 안내
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {verificationSteps.map((item, index) => (
                    <div
                      key={item}
                      className="rounded-[8px] border border-[#E5E7EB] bg-white p-4"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F5132] text-sm font-black text-white">
                        {index + 1}
                      </span>
                      <p className="mt-3 text-sm font-black text-[#111111]">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] p-4">
                <p className="text-sm font-black text-[#111111]">플랜 선택</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      value: "free",
                      title: "Free Plan",
                      description: "기본 노출",
                    },
                    {
                      value: "premium",
                      title: "Premium Plan",
                      description: "상단 노출, PREMIUM 배지, AI 추천 우선",
                    },
                  ].map((plan) => (
                    <button
                      key={plan.value}
                      type="button"
                      onClick={() =>
                        setPlanType(plan.value as "free" | "premium")
                      }
                      className={`rounded-[8px] border p-4 text-left transition hover:-translate-y-0.5 ${
                        planType === plan.value
                          ? "border-[#0F5132] bg-white shadow-[0_12px_35px_rgba(15,81,50,0.12)]"
                          : "border-[#E5E7EB] bg-white"
                      }`}
                    >
                      <p className="text-lg font-black text-[#111111]">
                        {plan.title}
                      </p>
                      <p className="mt-2 text-sm font-bold leading-6 text-[#374151]">
                        {plan.description}
                      </p>
                    </button>
                  ))}
                </div>
              </section>

              <button
                type="submit"
                className="rounded-full bg-[#0F5132] px-6 py-4 text-sm font-black text-white shadow-[0_14px_34px_rgba(15,81,50,0.18)] transition hover:-translate-y-0.5 hover:bg-[#146C43]"
              >
                검증 신청 제출
              </button>
            </form>
          </div>

          <aside className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] lg:sticky lg:top-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
              Profile Preview
            </p>
            <h2 className="mt-3 text-3xl font-black text-[#111111]">
              Profile Completeness
            </h2>
            <div className="mt-5 rounded-[8px] bg-[#FBFAF7] p-5">
              <div className="flex items-end justify-between gap-4">
                <p className="text-5xl font-black text-[#111111]">
                  {completenessScore}%
                </p>
                <p className="pb-2 text-sm font-black text-[#0F5132]">
                  Verified ready
                </p>
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#E5E7EB]">
                <div
                  className="h-full rounded-full bg-[#0F5132] transition-all"
                  style={{ width: `${completenessScore}%` }}
                />
              </div>
              <div className="mt-5 grid gap-2">
                {completenessItems.map((item) => {
                  const isComplete =
                    completenessChecks[item.key];

                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-3 rounded-[8px] bg-white p-3"
                    >
                      <span className="text-sm font-black text-[#111111]">
                        {item.label}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          isComplete
                            ? "bg-[#E8F2EC] text-[#0F5132]"
                            : "bg-[#F3F4F6] text-[#374151]"
                        }`}
                      >
                        {isComplete ? "완료" : "대기"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <section className="rounded-[8px] bg-[#FBFAF7] p-4">
                <h3 className="text-base font-black text-[#111111]">
                  검증 안내
                </h3>
                <ul className="mt-3 grid gap-2 text-sm font-bold leading-6 text-[#374151]">
                  {verificationSteps.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </section>

              <section className="rounded-[8px] bg-[#FBFAF7] p-4">
                <h3 className="text-base font-black text-[#111111]">
                  신청 상태
                </h3>
                <p className="mt-3 text-sm font-bold leading-6 text-[#374151]">
                  제출 즉시 승인 대기 상태로 저장됩니다.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#111111]">
                    approved=false
                  </span>
                  <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#111111]">
                    approval_status=pending
                  </span>
                </div>
              </section>
            </div>

            <Link
              href="/free-vs-premium"
              className="mt-6 inline-flex rounded-full border border-[#D9CFBF] bg-white px-5 py-3 text-sm font-black text-[#0F5132] transition hover:border-[#111111]"
            >
              Free vs Premium 보기
            </Link>
          </aside>
        </section>
      </div>
    </main>
  );
}
