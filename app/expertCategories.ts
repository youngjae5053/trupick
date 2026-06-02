export type ExpertCategory =
  | "운동/재활"
  | "세무"
  | "법률"
  | "사진/영상"
  | "디자인"
  | "마케팅"
  | "심리상담";

export type ExpertCategoryItem = {
  label: ExpertCategory;
  description: string;
  icon: string;
};

export const expertCategories: ExpertCategoryItem[] = [
  {
    label: "운동/재활",
    description: "체력, 자세, 회복 코칭",
    icon: "M",
  },
  {
    label: "세무",
    description: "신고, 절세, 사업 세금",
    icon: "T",
  },
  {
    label: "법률",
    description: "계약, 분쟁, 생활 법률",
    icon: "L",
  },
  {
    label: "사진/영상",
    description: "촬영, 편집, 콘텐츠 제작",
    icon: "P",
  },
  {
    label: "디자인",
    description: "브랜딩, UI, 시각 디자인",
    icon: "D",
  },
  {
    label: "마케팅",
    description: "성장, 광고, 퍼널 전략",
    icon: "G",
  },
  {
    label: "심리상담",
    description: "마음 건강, 관계 상담",
    icon: "C",
  },
];

export const expertCategoryLabels = expertCategories.map(
  (category) => category.label
);

export function getCategoryHref(category: ExpertCategory) {
  return `/experts?category=${encodeURIComponent(category)}`;
}

export function isExpertCategory(value: string | null): value is ExpertCategory {
  return expertCategoryLabels.includes(value as ExpertCategory);
}
