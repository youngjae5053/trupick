export type ProfileCompletenessInput = {
  image_url?: string | null;
  main_profile_image?: string | null;
  profile_images?: string[] | null;
  photoUrl?: string | null;
  description?: string | null;
  intro_line?: string | null;
  career?: string | null;
  career_summary?: string | null;
  career_years?: string | null;
  certifications?: string[] | string | null;
  location?: string | null;
  activity_area?: string | null;
  consultation_methods?: string[] | string | null;
  sns_url?: string | null;
  portfolio_url?: string | null;
  portfolio?: string[] | string | null;
};

export type ProfileCompletenessResult = {
  score: number;
  completedCount: number;
  totalCount: number;
  suggestions: string[];
  items: Array<{
    key: string;
    label: string;
    complete: boolean;
    suggestion: string;
  }>;
};

function hasText(value?: string | null) {
  return Boolean(value && value.trim().length > 0);
}

function hasListValue(value?: string[] | string | null) {
  if (Array.isArray(value)) {
    return value.some((item) => item.trim().length > 0);
  }

  return hasText(value);
}

function hasCertification(input: ProfileCompletenessInput) {
  if (hasListValue(input.certifications)) {
    return true;
  }

  const career = input.career || "";

  return /자격|세무사|변호사|관리사|지도사|CPT|NSCA|협회|등록/.test(career);
}

export function getProfileCompleteness(
  input: ProfileCompletenessInput
): ProfileCompletenessResult {
  const items = [
    {
      key: "photo",
      label: "프로필 사진",
      complete:
        hasText(input.image_url) ||
        hasText(input.main_profile_image) ||
        hasListValue(input.profile_images) ||
        hasText(input.photoUrl),
      suggestion: "프로필 사진을 추가하면 첫인상이 좋아집니다.",
    },
    {
      key: "description",
      label: "소개글",
      complete: hasText(input.description) || hasText(input.intro_line),
      suggestion: "소개글을 보강하면 상담 전 신뢰도가 높아집니다.",
    },
    {
      key: "career",
      label: "경력",
      complete:
        hasText(input.career) ||
        hasText(input.career_summary) ||
        hasText(input.career_years),
      suggestion: "주요 경력을 추가하면 전문성이 더 잘 드러납니다.",
    },
    {
      key: "certifications",
      label: "자격증",
      complete: hasCertification(input),
      suggestion: "자격증을 추가하면 신뢰도가 높아집니다.",
    },
    {
      key: "location",
      label: "활동 지역",
      complete: hasText(input.location) || hasText(input.activity_area),
      suggestion: "활동 지역을 입력하면 가까운 고객에게 더 잘 노출됩니다.",
    },
    {
      key: "consultation_methods",
      label: "상담 방식",
      complete: hasListValue(input.consultation_methods),
      suggestion: "상담 방식을 추가하면 고객이 더 쉽게 요청할 수 있습니다.",
    },
    {
      key: "sns_url",
      label: "SNS 링크",
      complete: hasText(input.sns_url),
      suggestion: "SNS 링크를 추가하면 활동 이력을 확인하기 쉬워집니다.",
    },
    {
      key: "portfolio",
      label: "포트폴리오",
      complete: hasText(input.portfolio_url) || hasListValue(input.portfolio),
      suggestion: "포트폴리오를 추가하면 결과물 신뢰도가 높아집니다.",
    },
  ];

  const completedCount = items.filter((item) => item.complete).length;
  const totalCount = items.length;
  const score = Math.round((completedCount / totalCount) * 100);

  return {
    score,
    completedCount,
    totalCount,
    suggestions: items
      .filter((item) => !item.complete)
      .map((item) => item.suggestion),
    items,
  };
}
