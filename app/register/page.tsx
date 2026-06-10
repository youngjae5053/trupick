"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { trackAnalyticsEvent } from "@/app/analytics";
import { getFriendlyErrorMessage } from "@/app/errorMessages";
import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

type UserRole = "customer" | "expert" | "admin";
type SaveMode = "draft" | "pending";
type ExpertStatus = "draft" | "pending" | "pending_review" | "approved" | "rejected";

type ExpertCase = {
  id: string;
  title: string;
  problem: string;
  process: string;
  result: string;
  duration: string;
  image_url: string;
  before_image_url: string;
  after_image_url: string;
};

type ExistingExpert = {
  id: number;
  name: string | null;
  phone?: string | null;
  specialty: string | null;
  location: string | null;
  activity_area?: string | null;
  specialties?: string[] | null;
  career_years?: string | null;
  career_summary?: string | null;
  career?: string | null;
  certifications?: string[] | string | null;
  profile_images?: string[] | null;
  main_profile_image?: string | null;
  image_url?: string | null;
  intro_line?: string | null;
  philosophy?: string | null;
  cases?: ExpertCase[] | null;
  consultation_methods?: string[] | null;
  consultation_fee?: string | null;
  detailed_location?: string | null;
  center_name?: string | null;
  map_address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  video_url?: string | null;
  extra_intro?: string | null;
  details?: ExpertDetails | null;
  portfolio_url?: string | null;
  sns_url?: string | null;
  approved?: boolean | null;
  approval_status?: ExpertStatus | null;
  status?: ExpertStatus | null;
};

type ExpertDetails = {
  application_status: ExpertStatus;
  detailed_location: string;
  center_name: string;
  map_address: string;
  latitude: number | null;
  longitude: number | null;
  philosophy: string;
  consultation_methods: string[];
  consultation_fee: string;
  sns_url: string;
  website_url: string;
  portfolio_url: string;
  instagram_url: string;
  video_url: string;
  plan_type: "free" | "premium";
  extra_intro: string;
  teaching_style: string;
  target_clients: string;
  updated_at: string;
};

type ExpertSavePayload = {
  user_id: string;
  name: string;
  phone: string;
  activity_area: string;
  location: string;
  specialties: string[];
  intro_line: string;
  career_years: string;
  career_summary: string;
  certifications: string[];
  profile_images: string[];
  main_profile_image: string | null;
  cases: ExpertCase[];
  profile_completion_score: number;
  updated_at: string;
  approved: boolean;
  approval_status: ExpertStatus;
  details: ExpertDetails;
};

type SavedExpertRow = {
  id: number;
  approval_status?: ExpertStatus | null;
};

const wizardSteps = [
  { id: 1, label: "기본 정보", title: "고객이 가장 먼저 보는 정보를 입력해주세요." },
  { id: 2, label: "전문성", title: "전문가로 활동한 이력을 알려주세요." },
  { id: 3, label: "소개와 사례", title: "철학과 고객 변화 사례를 정리해주세요." },
  { id: 4, label: "검토 및 제출", title: "완성도를 확인하고 저장 방식을 선택하세요." },
];

const consultationOptions = ["센터 방문", "온라인", "방문 상담"];
const emptyCase = (): ExpertCase => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  title: "",
  problem: "",
  process: "",
  result: "",
  duration: "",
  image_url: "",
  before_image_url: "",
  after_image_url: "",
});

function RequiredBadge() {
  return (
    <span className="rounded-full bg-[#111111] px-2 py-1 text-[10px] font-black text-white">
      필수
    </span>
  );
}

function OptionalBadge() {
  return (
    <span className="rounded-full bg-[#E5E7EB] px-2 py-1 text-[10px] font-black text-[#374151]">
      선택
    </span>
  );
}

function FieldLabel({
  children,
  required = false,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-black text-[#111111]">
      {children}
      {required ? <RequiredBadge /> : <OptionalBadge />}
    </label>
  );
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
      className="mt-2 min-h-12 w-full rounded-[8px] border border-[#D9CFBF] bg-white px-4 text-sm font-bold text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
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
      className="mt-2 w-full resize-y rounded-[8px] border border-[#D9CFBF] bg-white px-4 py-3 text-sm font-bold leading-7 text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111]"
    />
  );
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function stringifyCertifications(value: ExistingExpert["certifications"]) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return value || "";
}

function normalizeCases(value: ExistingExpert["cases"]) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    const legacyItem = item as ExpertCase & {
      imageUrl?: string;
      beforeImageUrl?: string;
      afterImageUrl?: string;
    };

    return {
      id: item.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: item.title || "",
      problem: item.problem || "",
      process: item.process || "",
      result: item.result || "",
      duration: item.duration || "",
      image_url: item.image_url || legacyItem.imageUrl || "",
      before_image_url: item.before_image_url || legacyItem.beforeImageUrl || "",
      after_image_url: item.after_image_url || legacyItem.afterImageUrl || "",
    };
  });
}

function getStatusLabel(status: ExpertStatus | null | undefined) {
  if (status === "draft") return "임시 저장";
  if (status === "approved") return "승인 완료";
  if (status === "rejected") return "거절";
  if (status === "pending_review") return "재검토 대기";
  return "검토 대기";
}

function pickExpertPayload(payload: ExpertSavePayload) {
  return {
    user_id: payload.user_id,
    name: payload.name,
    phone: payload.phone,
    activity_area: payload.activity_area,
    location: payload.location,
    specialties: payload.specialties,
    intro_line: payload.intro_line,
    career_years: payload.career_years,
    career_summary: payload.career_summary,
    certifications: payload.certifications,
    profile_images: payload.profile_images,
    main_profile_image: payload.main_profile_image,
    cases: payload.cases,
    profile_completion_score: payload.profile_completion_score,
    updated_at: payload.updated_at,
    approved: payload.approved,
    approval_status: payload.approval_status,
    details: payload.details,
  };
}

function getMissingColumnName(message?: string | null) {
  if (!message) {
    return null;
  }

  return (
    message.match(/'([^']+)' column/)?.[1] ||
    message.match(/column "([^"]+)"/)?.[1] ||
    message.match(/Could not find the '([^']+)'/)?.[1] ||
    null
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [expertId, setExpertId] = useState<number | null>(null);
  const [currentStatus, setCurrentStatus] = useState<ExpertStatus | null>(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [savingMode, setSavingMode] = useState<SaveMode | null>(null);
  const [uploadingImageKey, setUploadingImageKey] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [activityArea, setActivityArea] = useState("");
  const [detailedLocation, setDetailedLocation] = useState("");
  const [centerName, setCenterName] = useState("");
  const [mapAddress, setMapAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [consultationMethods, setConsultationMethods] = useState<string[]>([]);
  const [consultationFee, setConsultationFee] = useState("");
  const [profileImages, setProfileImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState("");
  const [mainProfileImage, setMainProfileImage] = useState("");
  const [careerYears, setCareerYears] = useState("");
  const [careerSummary, setCareerSummary] = useState("");
  const [certifications, setCertifications] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [snsUrl, setSnsUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [introLine, setIntroLine] = useState("");
  const [philosophy, setPhilosophy] = useState("");
  const [extraIntro, setExtraIntro] = useState("");
  const [cases, setCases] = useState<ExpertCase[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadSessionAndDraft() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          console.error("register session error", sessionError);
        }

        const user = sessionData.session?.user ?? null;

        if (!isMounted) return;

        if (!user) {
          router.replace("/login?redirect=/register");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle<{ role: UserRole }>();

        if (profileError) {
          console.error("register profile lookup error", profileError);
        }

        if (!profile && profileError) {
          setMessage(
            "프로필 정보는 불러오지 못했지만 등록은 계속할 수 있습니다."
          );
        }

        if (!profile) {
          const fallbackName =
            (user.user_metadata?.name as string | undefined) ||
            (user.user_metadata?.full_name as string | undefined) ||
            user.email?.split("@")[0] ||
            "";

          if (fallbackName) {
            setName((current) => current || fallbackName);
          }
        }

        const { data: existing, error: expertError } = await supabase
          .from("experts")
          .select("*")
          .eq("user_id", user.id)
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle<ExistingExpert>();

        if (expertError) {
          console.error("register existing expert lookup error", expertError);
          setMessage(
            "기존 저장 정보를 불러오지 못했지만 새로 저장할 수 있습니다."
          );
        }

        if (existing && isMounted) {
          const details = existing.details;

          setExpertId(existing.id);
          setCurrentStatus(existing.approval_status ?? existing.status ?? null);
          setName(existing.name ?? "");
          setPhone(existing.phone ?? "");
          setActivityArea(existing.activity_area ?? existing.location ?? "");
          setDetailedLocation(
            details?.detailed_location ?? existing.detailed_location ?? ""
          );
          setCenterName(details?.center_name ?? existing.center_name ?? "");
          setMapAddress(details?.map_address ?? existing.map_address ?? "");
          setLatitude(
            details?.latitude
              ? String(details.latitude)
              : existing.latitude
                ? String(existing.latitude)
                : ""
          );
          setLongitude(
            details?.longitude
              ? String(details.longitude)
              : existing.longitude
                ? String(existing.longitude)
                : ""
          );
          setSpecialty(
            existing.specialties?.length
                ? existing.specialties.join(", ")
                : existing.specialty ?? ""
          );
          setCareerYears(existing.career_years ?? "");
          setCareerSummary(existing.career_summary ?? existing.career ?? "");
          setCertifications(stringifyCertifications(existing.certifications));
          setProfileImages(
            existing.profile_images?.length
              ? existing.profile_images
              : existing.image_url
                ? [existing.image_url]
                : []
          );
          setMainProfileImage(existing.main_profile_image ?? existing.image_url ?? "");
          setIntroLine(existing.intro_line ?? "");
          setPhilosophy(details?.philosophy ?? existing.philosophy ?? "");
          setCases(normalizeCases(existing.cases));
          setConsultationMethods(
            details?.consultation_methods ?? existing.consultation_methods ?? []
          );
          setConsultationFee(
            details?.consultation_fee ?? existing.consultation_fee ?? ""
          );
          setPortfolioUrl(details?.portfolio_url ?? existing.portfolio_url ?? "");
          setSnsUrl(details?.sns_url ?? existing.sns_url ?? "");
          setVideoUrl(details?.video_url ?? existing.video_url ?? "");
          setExtraIntro(details?.extra_intro ?? existing.extra_intro ?? "");
        }

        if (isMounted) setCheckingAuth(false);
      } catch (error) {
        console.error("register load error", error);
        if (isMounted) {
          setMessage(
            "일부 정보를 불러오지 못했지만 등록은 계속할 수 있습니다."
          );
          setCheckingAuth(false);
        }
      }
    }

    void loadSessionAndDraft();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const requiredReady = Boolean(
    name.trim() &&
      phone.trim() &&
      activityArea.trim() &&
      specialty.trim() &&
      introLine.trim()
  );

  const completion = useMemo(() => {
    let score = 0;
    const missing: string[] = [];

    const basicFields = [name, phone, activityArea, introLine];
    score += Math.round(
      (basicFields.filter((value) => value.trim()).length / basicFields.length) *
        30
    );

    if (specialty.trim()) score += 20;
    else missing.push("전문 분야를 1개 이상 입력해주세요.");

    if (profileImages.length > 0) score += 15;
    else missing.push("프로필 사진을 추가하면 신뢰도가 높아집니다.");

    if (careerYears.trim() || careerSummary.trim() || certifications.trim()) {
      score += 15;
    } else {
      missing.push("자격/교육 이력을 작성하면 검토가 빨라집니다.");
    }

    if (cases.some((item) => item.title.trim() || item.result.trim())) {
      score += 20;
    } else {
      missing.push("대표 사례를 추가하면 고객이 더 쉽게 판단할 수 있습니다.");
    }

    if (!name.trim()) missing.push("이름은 필수입니다.");
    if (!phone.trim()) missing.push("연락처는 필수입니다.");
    if (!activityArea.trim()) missing.push("주요 활동 지역은 필수입니다.");
    if (!introLine.trim()) missing.push("고객에게 보여줄 한 문장은 필수입니다.");

    return { score: Math.min(score, 100), missing };
  }, [
    activityArea,
    careerSummary,
    careerYears,
    cases,
    certifications,
    introLine,
    name,
    phone,
    profileImages.length,
    specialty,
  ]);

  function toggleConsultationMethod(method: string) {
    setConsultationMethods((current) =>
      current.includes(method)
        ? current.filter((item) => item !== method)
        : [...current, method]
    );
  }

  function addProfileImage(url = imageInput.trim()) {
    if (!url) return;
    setProfileImages((current) => {
      if (current.includes(url)) return current;
      const next = [...current, url];
      if (!mainProfileImage) setMainProfileImage(url);
      return next;
    });
    setImageInput("");
  }

  async function uploadExpertAsset(file: File, prefix: string) {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        throw new Error("로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${userId}/${prefix}-${Date.now()}-${safeName}`;
      const { error } = await supabase.storage
        .from("expert-assets")
        .upload(path, file, { upsert: false });

      if (error) {
        console.error("expert asset upload error", error);
        throw error;
      }

      const { data } = supabase.storage.from("expert-assets").getPublicUrl(path);

      return data.publicUrl;
    } catch (error) {
      console.error("expert asset upload unexpected error", error);
      throw error;
    }
  }

  async function uploadProfileImage(file: File) {
    setErrorMessage("");
    setUploadingImageKey("profile");

    try {
      const publicUrl = await uploadExpertAsset(file, "profile");

      if (publicUrl) {
        addProfileImage(publicUrl);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `사진 업로드 실패: ${error.message}`
          : "사진 업로드 중 예상치 못한 오류가 발생했습니다."
      );
    } finally {
      setUploadingImageKey(null);
    }
  }

  function removeProfileImage(url: string) {
    setProfileImages((current) => current.filter((item) => item !== url));
    if (mainProfileImage === url) {
      setMainProfileImage(profileImages.find((item) => item !== url) ?? "");
    }
  }

  function updateCase(id: string, key: keyof ExpertCase, value: string) {
    setCases((current) =>
      current.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    );
  }

  async function uploadCaseImage(
    caseId: string,
    key: "image_url" | "before_image_url" | "after_image_url",
    file: File
  ) {
    setErrorMessage("");
    setUploadingImageKey(`${caseId}-${key}`);

    try {
      const publicUrl = await uploadExpertAsset(file, `case-${key}`);

      if (publicUrl) {
        updateCase(caseId, key, publicUrl);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `사례 사진 업로드 실패: ${error.message}`
          : "사례 사진 업로드 중 예상치 못한 오류가 발생했습니다."
      );
    } finally {
      setUploadingImageKey(null);
    }
  }

  function validateSubmit(mode: SaveMode) {
    if (mode === "draft") {
      return true;
    }

    if (!requiredReady) {
      setErrorMessage(
        "검증 신청 제출에는 이름, 연락처, 주요 활동 지역, 전문 분야, 고객에게 보여줄 한 문장이 필요합니다."
      );
      setCurrentStep(1);
      return false;
    }

    return true;
  }

  async function saveExpertProfile(mode: SaveMode) {
    setMessage("");
    setErrorMessage("");

    if (!validateSubmit(mode)) return;

    setSavingMode(mode);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error("register getUser error", userError);
      }

      const userId = userData.user?.id;

      if (!userId) {
        setErrorMessage("로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
        setSavingMode(null);
        return;
      }

      const nextStatus: ExpertStatus =
        mode === "draft"
          ? currentStatus === "approved"
            ? "pending_review"
            : "draft"
          : currentStatus === "approved"
            ? "pending_review"
            : "pending";
      const specialtyItems = splitList(specialty);
      const filteredCases = cases.filter(
        (item) =>
          item.title.trim() ||
          item.problem.trim() ||
          item.process.trim() ||
          item.result.trim()
      );
      const mainImage = mainProfileImage || profileImages[0] || "";
      const fallbackName =
        name.trim() ||
        (userData.user?.user_metadata?.name as string | undefined) ||
        (userData.user?.user_metadata?.full_name as string | undefined) ||
        userData.user?.email?.split("@")[0] ||
        "이름 미입력";
      const fallbackSpecialty =
        specialtyItems[0] || specialty.trim() || "전문 분야 미입력";
      const fallbackLocation = activityArea.trim() || "활동 지역 미입력";
      const fallbackIntro = introLine.trim() || "한 줄 소개 미입력";
      const locationLabel = [activityArea.trim(), detailedLocation.trim()]
        .filter(Boolean)
        .join(" · ");

      const legacyCareer = [
        careerYears.trim() ? `경력 년수: ${careerYears.trim()}` : "",
        careerSummary.trim() ? `주요 경력: ${careerSummary.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");
      const details: ExpertDetails = {
        application_status: nextStatus,
        detailed_location: detailedLocation.trim(),
        center_name: centerName.trim(),
        map_address: mapAddress.trim(),
        latitude: latitude.trim() ? Number(latitude) : null,
        longitude: longitude.trim() ? Number(longitude) : null,
        philosophy: philosophy.trim(),
        consultation_methods: consultationMethods,
        consultation_fee: consultationFee.trim(),
        sns_url: snsUrl.trim(),
        website_url: "",
        portfolio_url: portfolioUrl.trim(),
        instagram_url: snsUrl.trim(),
        video_url: videoUrl.trim(),
        plan_type: "free",
        extra_intro: extraIntro.trim(),
        teaching_style: philosophy.trim(),
        target_clients: "",
        updated_at: new Date().toISOString(),
      };
      const payload = pickExpertPayload({
        user_id: userId,
        name: fallbackName,
        phone: phone.trim(),
        activity_area: activityArea.trim(),
        location: locationLabel || fallbackLocation,
        specialties: specialtyItems.length > 0 ? specialtyItems : [fallbackSpecialty],
        intro_line: fallbackIntro,
        career_years: careerYears.trim(),
        career_summary: careerSummary.trim() || legacyCareer,
        certifications: splitList(certifications),
        profile_images: profileImages,
        main_profile_image: mainImage || null,
        cases: filteredCases,
        profile_completion_score: completion.score,
        updated_at: new Date().toISOString(),
        approved: false,
        approval_status: nextStatus,
        details,
      });

      let targetExpertId = expertId;

      if (!targetExpertId) {
        const { data: existingByUser, error: existingByUserError } =
          await supabase
            .from("experts")
            .select("id")
            .eq("user_id", userId)
            .order("id", { ascending: false })
            .limit(1)
            .maybeSingle<{ id: number }>();

        if (existingByUserError) {
          console.error("expert application existing lookup error", existingByUserError);
        }

        targetExpertId = existingByUser?.id ?? null;
      }

      async function persistExpert(savePayload: ExpertSavePayload) {
        if (targetExpertId) {
          return supabase
            .from("experts")
            .update(savePayload)
            .eq("id", targetExpertId)
            .select("id, approval_status")
            .maybeSingle<SavedExpertRow>();
        }

        return supabase
          .from("experts")
          .insert([savePayload])
          .select("id, approval_status")
          .maybeSingle<SavedExpertRow>();
      }

      const { data, error } = await persistExpert(payload);

      if (error) {
        const missingColumn = getMissingColumnName(error.message);

        console.error("expert application save error", {
          error,
          missingColumn,
          attemptedColumns: Object.keys(payload),
          payload,
        });
        setErrorMessage(
          missingColumn
            ? `${missingColumn} 컬럼 문제로 저장에 실패했습니다. (${error.message})`
            : `${getFriendlyErrorMessage(error.message)} (${error.message})`
        );
        setSavingMode(null);
        return;
      }

      if (data?.id) {
        setExpertId(data.id);
        setCurrentStatus(data.approval_status ?? nextStatus);
      }

      void trackAnalyticsEvent({
        eventName: "expert_register",
        page: "/register",
        metadata: {
          mode,
          status: nextStatus,
          specialty: specialty.trim(),
          profile_completion_score: completion.score,
        },
      });

      setMessage(
        mode === "draft"
          ? "임시 저장되었습니다. 마이페이지에서 이어서 수정할 수 있습니다."
          : "전문가 등록 신청이 접수되었습니다. TRUPICK 팀이 검토 후 승인 여부를 안내드립니다."
      );

      if (mode === "pending") {
        router.push("/mypage");
      }
    } catch (error) {
      console.error("expert application unexpected error", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "전문가 등록 중 예상치 못한 오류가 발생했습니다."
      );
    } finally {
      setSavingMode(null);
    }
  }

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-[#F6F3EC] px-4 py-10 text-[#111111]">
        <section className="mx-auto max-w-3xl rounded-[8px] border border-[#E5E7EB] bg-white p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
            Checking Session
          </p>
          <h1 className="mt-3 text-3xl font-black">로그인 상태를 확인하고 있습니다.</h1>
        </section>
      </main>
    );
  }

  const activeStep = wizardSteps[currentStep - 1];

  return (
    <main className="min-h-screen bg-[#F6F3EC] px-4 py-6 text-[#111111] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-2xl font-extrabold tracking-[0.16em]">
            TRUPICK
          </Link>
          <Link href="/mypage" className="w-fit rounded-full border border-[#D9CFBF] bg-white px-4 py-2 text-sm font-black text-[#0F5132]">
            마이페이지
          </Link>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-[0_24px_80px_rgba(24,24,20,0.08)] sm:p-8 lg:p-10">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#0F5132]">
              Verified Expert Application
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight tracking-[-0.02em] sm:text-5xl">
              TRUPICK 검증 전문가로 등록하기
            </h1>
            <p className="mt-4 max-w-2xl text-base font-bold leading-7 text-[#374151]">
              최소 정보만 입력해도 신청할 수 있습니다. 부족한 정보는 프로필 완성도로 확인하고, 마이페이지에서 계속 보완하세요.
            </p>
            {currentStatus ? (
              <span className="mt-5 inline-flex rounded-full bg-[#E8F2EC] px-4 py-2 text-sm font-black text-[#0F5132]">
                현재 상태: {getStatusLabel(currentStatus)}
              </span>
            ) : null}

            <div className="mt-8 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
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
                  <span className="text-xs font-black text-[#0F5132]">{step.id}</span>
                  <span className="mt-1 block text-xs font-black leading-5">{step.label}</span>
                </button>
              ))}
            </div>

            {message ? (
              <div className="mt-5 rounded-[8px] border border-[#B7E3C9] bg-[#E8F2EC] p-4 text-sm font-black text-[#0F5132]">
                {message}
              </div>
            ) : null}
            {errorMessage ? (
              <div className="mt-5 rounded-[8px] border border-[#FCA5A5] bg-[#FEE2E2] p-4 text-sm font-black text-[#991B1B]">
                {errorMessage}
              </div>
            ) : null}

            <div className="mt-8 rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-5 sm:p-6">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
                Step {activeStep.id}
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.02em]">
                {activeStep.title}
              </h2>

              {currentStep === 1 ? (
                <div className="mt-6 grid gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <FieldLabel required>이름</FieldLabel>
                      <TextInput value={name} onChange={setName} placeholder="김영재" />
                    </div>
                    <div>
                      <FieldLabel required>연락처</FieldLabel>
                      <TextInput value={phone} onChange={setPhone} placeholder="010-0000-0000" type="tel" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel required>고객에게 보여줄 한 문장</FieldLabel>
                    <TextInput value={introLine} onChange={setIntroLine} placeholder="통증 없이 움직이는 몸을 만드는 재활운동 코치" />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <FieldLabel required>주요 활동 지역</FieldLabel>
                      <TextInput value={activityArea} onChange={setActivityArea} placeholder="서울 강남구" />
                    </div>
                    <div>
                      <FieldLabel>상세 위치 설명</FieldLabel>
                      <TextInput value={detailedLocation} onChange={setDetailedLocation} placeholder="선릉역 인근" />
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <FieldLabel>센터명 또는 활동 장소</FieldLabel>
                      <TextInput value={centerName} onChange={setCenterName} placeholder="TRUPICK 퍼포먼스 센터" />
                    </div>
                    <div>
                      <FieldLabel>지도 표시용 주소</FieldLabel>
                      <TextInput value={mapAddress} onChange={setMapAddress} placeholder="서울 강남구 테헤란로 ..." />
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <FieldLabel>위도</FieldLabel>
                      <TextInput value={latitude} onChange={setLatitude} placeholder="37.501" type="number" />
                    </div>
                    <div>
                      <FieldLabel>경도</FieldLabel>
                      <TextInput value={longitude} onChange={setLongitude} placeholder="127.039" type="number" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel required>전문 분야 1개 이상</FieldLabel>
                    <TextInput value={specialty} onChange={setSpecialty} placeholder="재활운동, 통증관리, 체형교정" />
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
                            className={`rounded-[8px] border p-4 text-left text-sm font-black transition ${
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
                  <div>
                    <FieldLabel>상담비</FieldLabel>
                    <TextInput value={consultationFee} onChange={setConsultationFee} placeholder="예: 첫 상담 무료 / 1회 50,000원" />
                  </div>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="mt-6 grid gap-5">
                  <div>
                    <FieldLabel>전문가로 활동한 기간</FieldLabel>
                    <TextInput value={careerYears} onChange={setCareerYears} placeholder="예: 8년" />
                  </div>
                  <div>
                    <FieldLabel>대표 경력 및 활동 이력</FieldLabel>
                    <TextArea value={careerSummary} onChange={setCareerSummary} placeholder="운동센터 운영, 재활 지도 경험, 교육 이력 등을 입력해주세요." />
                  </div>
                  <div>
                    <FieldLabel>자격·교육·수료 이력</FieldLabel>
                    <TextArea value={certifications} onChange={setCertifications} placeholder="생활스포츠지도사, 건강운동관리사, 재활운동 교육 등 쉼표로 구분" />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <FieldLabel>포트폴리오 링크</FieldLabel>
                      <TextInput value={portfolioUrl} onChange={setPortfolioUrl} placeholder="https://..." type="url" />
                    </div>
                    <div>
                      <FieldLabel>인스타그램 또는 웹사이트 링크</FieldLabel>
                      <TextInput value={snsUrl} onChange={setSnsUrl} placeholder="https://..." type="url" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>영상 URL</FieldLabel>
                    <TextInput value={videoUrl} onChange={setVideoUrl} placeholder="인터뷰/소개 영상 URL" type="url" />
                  </div>
                </div>
              ) : null}

              {currentStep === 3 ? (
                <div className="mt-6 grid gap-6">
                  <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <FieldLabel>프로필 사진</FieldLabel>
                      <span className="text-xs font-bold text-[#374151]">사진이 없어도 제출 가능합니다.</span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <input
                        value={imageInput}
                        onChange={(event) => setImageInput(event.target.value)}
                        placeholder="사진 URL을 붙여넣으세요"
                        className="min-h-12 rounded-[8px] border border-[#D9CFBF] bg-[#FBFAF7] px-4 text-sm font-bold outline-none"
                      />
                      <button type="button" onClick={() => addProfileImage()} className="rounded-full bg-[#111111] px-5 py-3 text-sm font-black text-white">
                        + 사진 추가
                      </button>
                    </div>
                    <label className="mt-3 flex min-h-24 cursor-pointer items-center justify-center rounded-[8px] border border-dashed border-[#D9CFBF] bg-[#FBFAF7] px-4 py-5 text-center text-sm font-black text-[#111111]">
                      파일 업로드 시도
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadProfileImage(file);
                        }}
                      />
                    </label>
                    {uploadingImageKey === "profile" ? (
                      <p className="mt-3 text-sm font-bold text-[#0F5132]">
                        프로필 사진을 업로드하는 중입니다.
                      </p>
                    ) : null}
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {profileImages.map((url) => (
                        <div key={url} className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="프로필 사진" className="aspect-square w-full rounded-[8px] object-cover" />
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button type="button" onClick={() => setMainProfileImage(url)} className={`rounded-full px-3 py-2 text-xs font-black ${mainProfileImage === url ? "bg-[#0F5132] text-white" : "bg-white text-[#111111]"}`}>
                              대표 사진
                            </button>
                            <button type="button" onClick={() => removeProfileImage(url)} className="rounded-full bg-[#FEE2E2] px-3 py-2 text-xs font-black text-[#991B1B]">
                              삭제
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div>
                    <FieldLabel>지도 철학과 상담 방식</FieldLabel>
                    <TextArea value={philosophy} onChange={setPhilosophy} placeholder="고객을 어떻게 돕는지, 어떤 방식으로 상담/수업하는지 적어주세요." />
                  </div>
                  <div>
                    <FieldLabel>기타 소개 내용</FieldLabel>
                    <TextArea value={extraIntro} onChange={setExtraIntro} placeholder="고객에게 더 알려주고 싶은 내용을 자유롭게 작성해주세요." />
                  </div>

                  <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-[#111111]">고객 변화 사례</p>
                        <p className="mt-1 text-xs font-bold text-[#374151]">사례가 없어도 제출 가능합니다.</p>
                      </div>
                      <button type="button" onClick={() => setCases((current) => [...current, emptyCase()])} className="rounded-full bg-[#0F5132] px-5 py-3 text-sm font-black text-white">
                        + 사례 추가
                      </button>
                    </div>
                    <div className="mt-4 grid gap-4">
                      {cases.map((item, index) => (
                        <article key={item.id} className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-lg font-black">사례 {index + 1}</h3>
                            <button type="button" onClick={() => setCases((current) => current.filter((caseItem) => caseItem.id !== item.id))} className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#991B1B]">
                              삭제
                            </button>
                          </div>
                          <div className="mt-4 grid gap-4">
                            <TextInput value={item.title} onChange={(value) => updateCase(item.id, "title", value)} placeholder="사례 제목" />
                            <TextArea value={item.problem} onChange={(value) => updateCase(item.id, "problem", value)} placeholder="고객이 처음 겪고 있던 문제" rows={3} />
                            <TextArea value={item.process} onChange={(value) => updateCase(item.id, "process", value)} placeholder="어떤 방식으로 도움을 주었나요?" rows={3} />
                            <TextArea value={item.result} onChange={(value) => updateCase(item.id, "result", value)} placeholder="어떤 변화가 있었나요?" rows={3} />
                            <div className="grid gap-4 sm:grid-cols-2">
                              <TextInput value={item.duration} onChange={(value) => updateCase(item.id, "duration", value)} placeholder="기간 예: 8주" />
                            </div>
                            <div className="grid gap-3 md:grid-cols-3">
                              {[
                                {
                                  label: "+ 사례 사진 추가",
                                  field: "image_url" as const,
                                  value: item.image_url,
                                },
                                {
                                  label: "+ Before 사진 추가",
                                  field: "before_image_url" as const,
                                  value: item.before_image_url,
                                },
                                {
                                  label: "+ After 사진 추가",
                                  field: "after_image_url" as const,
                                  value: item.after_image_url,
                                },
                              ].map((imageField) => {
                                const uploadKey = `${item.id}-${imageField.field}`;

                                return (
                                  <div
                                    key={imageField.field}
                                    className="rounded-[8px] border border-[#E5E7EB] bg-white p-3"
                                  >
                                    {imageField.value ? (
                                      <div>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={imageField.value}
                                          alt={imageField.label}
                                          className="aspect-[4/3] w-full rounded-[8px] object-cover"
                                        />
                                        <button
                                          type="button"
                                          onClick={() =>
                                            updateCase(item.id, imageField.field, "")
                                          }
                                          className="mt-3 rounded-full bg-[#FEE2E2] px-3 py-2 text-xs font-black text-[#991B1B]"
                                        >
                                          삭제
                                        </button>
                                      </div>
                                    ) : (
                                      <label className="flex min-h-32 cursor-pointer items-center justify-center rounded-[8px] border border-dashed border-[#D9CFBF] bg-[#FBFAF7] px-3 py-4 text-center text-sm font-black text-[#111111]">
                                        {uploadingImageKey === uploadKey
                                          ? "업로드 중..."
                                          : imageField.label}
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="sr-only"
                                          onChange={(event) => {
                                            const file = event.target.files?.[0];
                                            if (file) {
                                              void uploadCaseImage(
                                                item.id,
                                                imageField.field,
                                                file
                                              );
                                            }
                                          }}
                                        />
                                      </label>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              ) : null}

              {currentStep === 4 ? (
                <div className="mt-6 grid gap-5">
                  <section className="rounded-[8px] border border-[#E5E7EB] bg-white p-5">
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-[#0F5132]">
                      Profile Preview
                    </p>
                    <h3 className="mt-3 text-3xl font-black">{name || "전문가 이름"}</h3>
                    <p className="mt-2 text-sm font-bold leading-6 text-[#374151]">
                      {introLine || "고객에게 보여줄 한 문장"} · {activityArea || "주요 활동 지역"}
                    </p>
                    <dl className="mt-5 grid gap-3 text-sm font-bold text-[#374151] sm:grid-cols-2">
                      {[
                        ["전문 분야", specialty],
                        ["상담 방식", consultationMethods.join(", ")],
                        ["상담비", consultationFee],
                        ["활동 장소", [centerName, detailedLocation].filter(Boolean).join(" · ")],
                        ["경력", [careerYears, careerSummary].filter(Boolean).join(" · ")],
                        ["자격/교육", certifications],
                        ["사례 수", `${cases.length}개`],
                        ["대표 사진", mainProfileImage ? "선택 완료" : "미선택"],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-[8px] bg-[#FBFAF7] p-4">
                          <dt className="font-black text-[#111111]">{label}</dt>
                          <dd className="mt-1">{value || "선택 입력 없음"}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>

                  <section className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
                    <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-5">
                      <p className="text-sm font-black uppercase tracking-[0.14em] text-[#0F5132]">
                        Profile Completeness
                      </p>
                      <p className="mt-4 text-6xl font-black tracking-[-0.05em]">
                        {completion.score}%
                      </p>
                      <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#E5E7EB]">
                        <div className="h-full rounded-full bg-[#0F5132]" style={{ width: `${completion.score}%` }} />
                      </div>
                    </div>
                    <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-5">
                      <p className="text-sm font-black uppercase tracking-[0.14em] text-[#0F5132]">
                        보완하면 좋은 항목
                      </p>
                      <div className="mt-4 grid gap-2">
                        {completion.missing.length > 0 ? (
                          completion.missing.map((tip) => (
                            <p key={tip} className="rounded-[8px] bg-[#FFF7ED] p-3 text-sm font-bold text-[#9A3412]">
                              {tip}
                            </p>
                          ))
                        ) : (
                          <p className="rounded-[8px] bg-[#E8F2EC] p-3 text-sm font-bold text-[#0F5132]">
                            핵심 정보가 충분히 입력되었습니다.
                          </p>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => setCurrentStep((step) => Math.max(1, step - 1))} disabled={currentStep === 1} className="rounded-full border border-[#D9CFBF] bg-white px-6 py-3 text-sm font-black text-[#111111] disabled:opacity-50">
                이전
              </button>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => void saveExpertProfile("draft")} disabled={savingMode !== null} className="rounded-full border border-[#0F5132] bg-white px-6 py-3 text-sm font-black text-[#0F5132] disabled:opacity-60">
                  {savingMode === "draft" ? "저장 중..." : "임시 저장"}
                </button>
                {currentStep < wizardSteps.length ? (
                  <button type="button" onClick={() => setCurrentStep((step) => Math.min(wizardSteps.length, step + 1))} className="rounded-full bg-[#111111] px-6 py-3 text-sm font-black text-white">
                    다음
                  </button>
                ) : (
                  <button type="button" onClick={() => void saveExpertProfile("pending")} disabled={savingMode !== null} className="rounded-full bg-[#0F5132] px-6 py-3 text-sm font-black text-white disabled:opacity-60">
                    {savingMode === "pending" ? "제출 중..." : "검증 신청 제출"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <aside className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(24,24,20,0.08)] lg:sticky lg:top-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
              Completion Guide
            </p>
            <h2 className="mt-3 text-4xl font-black">{completion.score}%</h2>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#E5E7EB]">
              <div className="h-full rounded-full bg-[#0F5132]" style={{ width: `${completion.score}%` }} />
            </div>
            <div className="mt-6 grid gap-3">
              {[
                ["기본 정보", "30%"],
                ["전문 분야", "20%"],
                ["사진", "15%"],
                ["경력/자격", "15%"],
                ["대표 사례", "20%"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-[8px] bg-[#FBFAF7] p-3 text-sm font-black">
                  <span>{label}</span>
                  <span className="text-[#0F5132]">{value}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm font-bold leading-7 text-[#374151]">
              100%가 아니어도 제출할 수 있습니다. TRUPICK 팀이 인터뷰, 영상 촬영, 검증 자료를 이후에 함께 보완합니다.
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}
