"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";
import { getFriendlyErrorMessage } from "@/app/errorMessages";

type UserRole = "customer" | "expert" | "admin";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [career, setCareer] = useState("");
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
      image_url: imageUrl,
      approved: false,
    };

    const { error } = await supabase.from("experts").insert([
      {
        ...expertPayload,
        plan_type: planType,
        status: "pending",
      },
    ]);

    const retryWithoutStatus =
      error &&
      (error.message.includes("status") || error.message.includes("schema cache"))
        ? await supabase.from("experts").insert([
            {
              ...expertPayload,
              plan_type: planType,
            },
          ])
        : null;

    const retryWithoutPlan =
      (retryWithoutStatus?.error || error)?.message.includes("plan_type")
        ? await supabase.from("experts").insert([expertPayload])
        : null;

    const submitError = retryWithoutPlan?.error ?? retryWithoutStatus?.error ?? error;

    if (submitError) {
      console.error(submitError);
      alert(getFriendlyErrorMessage(submitError.message));
    } else {
      setSubmitted(true);
    }
  }

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-[#f7f3ea] px-4 py-10 text-[#111111]">
        <section className="mx-auto max-w-2xl rounded-[8px] border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
            Checking Session
          </p>
          <h1 className="mt-3 text-3xl font-black">로그인 상태를 확인하고 있습니다.</h1>
          <p className="mt-3 text-sm font-bold leading-7 text-[#4B5563]">
            전문가 등록은 로그인한 사용자만 이용할 수 있습니다.
          </p>
        </section>
      </main>
    );
  }

  if (accessDenied) {
    return (
      <main className="min-h-screen bg-[#f7f3ea] px-4 py-10 text-[#111111]">
        <section className="mx-auto max-w-2xl rounded-[8px] border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#D65339]">
            Expert Only
          </p>
          <h1 className="mt-3 text-4xl font-black">
            전문가 회원만 등록 가능합니다
          </h1>
          <p className="mt-4 text-sm font-bold leading-7 text-[#4B5563]">
            현재 계정은 고객 회원입니다. 전문가 등록이 필요하다면 전문가 계정으로
            가입하거나 관리자에게 권한 변경을 요청해주세요.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/experts"
              className="rounded-full bg-[#111111] px-6 py-3 text-sm font-black text-white"
            >
              전문가 둘러보기
            </Link>
            <Link
              href="/signup"
              className="rounded-full border border-[#E5E7EB] bg-white px-6 py-3 text-sm font-black text-[#111111]"
            >
              전문가 계정 만들기
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#f7f3ea] px-4 py-10 text-[#111111]">
        <section className="mx-auto max-w-2xl rounded-[8px] border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0F5132] text-xl font-black text-white">
            ✓
          </div>
          <h1 className="mt-5 text-4xl font-black">등록이 접수되었습니다</h1>
          <p className="mt-4 text-base font-bold leading-7 text-[#4B5563]">
            전문가 등록이 접수되었습니다. 관리자 승인 후 노출됩니다.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
      href="/"
      className="rounded-full bg-[#111111] px-6 py-3 text-sm font-black text-white"
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
                setImageUrlInput("");
                setPlanType("");
                setImageFile(null);
              }}
              className="rounded-full border border-[#E5E7EB] bg-white px-6 py-3 text-sm font-black text-[#111111]"
            >
              추가 등록
            </button>
          </div>
        </section>
      </main>
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

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#0F5132]">
              Professional Registration
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-normal text-[#111111] sm:text-5xl">
              전문가 프로필 등록
            </h1>
            <p className="mt-4 text-base font-bold leading-7 text-[#374151]">
              TRUPICK에서 검증된 전문가로 활동을 시작해보세요.
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
                  경력 <span className="text-[#6B7280]">선택</span>
                </label>
                <textarea
                  value={career}
                  onChange={(event) => setCareer(event.target.value)}
                  placeholder="주요 경력, 자격증, 프로젝트 경험을 적어주세요."
                  className="mt-2 min-h-28 w-full resize-y rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 py-3 text-sm font-bold leading-7 text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
                />
              </div>

              <section className="rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] p-4">
                <p className="text-sm font-black text-[#111111]">
                  프로필 이미지 URL 또는 이미지 업로드
                </p>
                <input
                  value={imageUrlInput}
                  onChange={(event) => setImageUrlInput(event.target.value)}
                  placeholder="https://example.com/profile.jpg"
                  className="mt-3 min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-white px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
                />
                <label className="mt-3 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed border-[#D9CFBF] bg-white px-4 py-5 text-center">
                  <span className="text-sm font-black text-[#111111]">
                    이미지 파일 업로드
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
                className="rounded-full bg-[#0F5132] px-6 py-4 text-sm font-black text-white transition hover:bg-[#146C43]"
              >
                전문가 등록 제출
              </button>
            </form>
          </div>

          <aside className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] lg:sticky lg:top-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
              Review Process
            </p>
            <h2 className="mt-3 text-3xl font-black text-[#111111]">
              등록 후 진행 과정
            </h2>
            <div className="mt-6 grid gap-4">
              {[
                "등록 후 관리자 검토",
                "승인 완료 후 전문가 목록 노출",
                "프로필 완성도가 높을수록 추천 가능성 증가",
              ].map((item, index) => (
                <div
                  key={item}
                  className="rounded-[8px] bg-[#FBFAF7] p-4"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F5132] text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <p className="mt-3 text-sm font-black leading-6 text-[#111111]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/free-vs-premium"
              className="mt-6 inline-flex rounded-full border border-[#D9CFBF] bg-white px-5 py-3 text-sm font-black text-[#0F5132]"
            >
              Free vs Premium 보기
            </Link>
          </aside>
        </section>
      </div>
    </main>
  );
}
