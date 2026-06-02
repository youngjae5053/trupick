import { ExpertCategory } from "@/app/expertCategories";

export type ExpertDiscoveryProfile = {
  id: number;
  nickname: string;
  profession: string;
  category: ExpertCategory;
  location: string;
  description: string;
  career: string;
  certifications: string[];
  consultationMethods: string[];
  snsUrl: string | null;
  portfolioUrl: string | null;
  planType: "free" | "premium";
  rating: number;
  reviewCount: number;
  distanceMeters: number;
  bearingDegrees: number;
  photoUrl: string;
};

export type UserDiscoveryLocation = {
  label: string;
  latitude: number;
  longitude: number;
};

export const mockUserLocation: UserDiscoveryLocation = {
  label: "서울 성수동 기준",
  latitude: 37.5446,
  longitude: 127.0557,
};

export async function getNearbyExperts(): Promise<ExpertDiscoveryProfile[]> {
  return mockExperts;
}

const mockExperts: ExpertDiscoveryProfile[] = [
  {
    id: 1,
    nickname: "김영재",
    profession: "스포츠 재활 트레이너",
    category: "운동/재활",
    location: "서울 강남구",
    description:
      "통증 이력과 움직임 패턴을 함께 분석해 재활 운동, 자세 교정, 근력 회복 프로그램을 설계합니다. 무리한 운동보다 지속 가능한 회복 루틴을 우선합니다.",
    career:
      "스포츠재활센터 수석 트레이너 · 건강운동관리사 · 재활 및 체형교정 경력 8년",
    certifications: ["건강운동관리사", "생활스포츠지도사", "NSCA-CPT"],
    consultationMethods: ["Visit", "Center", "Online"],
    snsUrl: "https://instagram.com/trupick_rehab",
    portfolioUrl: "https://trupick.example.com/experts/1",
    planType: "premium",
    rating: 4.98,
    reviewCount: 127,
    distanceMeters: 420,
    bearingDegrees: 38,
    photoUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=480&q=80",
  },
  {
    id: 2,
    nickname: "박민정",
    profession: "개인사업자 전문 세무사",
    category: "세무",
    location: "서울 송파구",
    description:
      "프리랜서와 소규모 사업자의 종합소득세, 부가세, 인건비 신고를 체계적으로 관리합니다. 사업 구조에 맞는 절세 체크리스트와 신고 일정을 함께 제공합니다.",
    career:
      "세무법인 팀장 출신 · 개인사업자 세무 자문 10년 · 누적 신고 1,200건 이상",
    certifications: ["세무사", "한국세무사회 등록"],
    consultationMethods: ["Online", "Visit"],
    snsUrl: null,
    portfolioUrl: "https://trupick.example.com/experts/2",
    planType: "premium",
    rating: 4.94,
    reviewCount: 98,
    distanceMeters: 890,
    bearingDegrees: 302,
    photoUrl:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=480&q=80",
  },
  {
    id: 3,
    nickname: "이준호",
    profession: "계약·분쟁 자문 변호사",
    category: "법률",
    location: "서울 서초구",
    description:
      "계약서 검토, 소상공인 분쟁, 생활 법률 상담을 명확한 언어로 안내합니다. 상담 후 바로 실행할 수 있는 대응 순서와 필요 서류를 정리해드립니다.",
    career:
      "법무법인 기업자문팀 · 계약 검토 및 민사 분쟁 경력 9년 · 대한변호사협회 등록",
    certifications: ["변호사", "대한변호사협회 등록"],
    consultationMethods: ["Online", "Visit"],
    snsUrl: null,
    portfolioUrl: null,
    planType: "free",
    rating: 4.89,
    reviewCount: 76,
    distanceMeters: 1380,
    bearingDegrees: 116,
    photoUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=480&q=80",
  },
  {
    id: 4,
    nickname: "최하은",
    profession: "브랜드 프로필 포토그래퍼",
    category: "사진/영상",
    location: "서울 마포구",
    description:
      "전문가 프로필, 브랜드 룩북, 인터뷰 콘텐츠 촬영을 진행합니다. 촬영 전 콘셉트 기획부터 보정 톤까지 목적에 맞춰 일관된 결과물을 만듭니다.",
    career:
      "상업 사진 스튜디오 운영 · 브랜드 프로필 촬영 7년 · 스타트업 및 크리에이터 촬영 300건 이상",
    certifications: ["상업 사진 스튜디오 운영"],
    consultationMethods: ["Center", "Visit"],
    snsUrl: "https://instagram.com/trupick_photo",
    portfolioUrl: "https://trupick.example.com/portfolio/photo",
    planType: "premium",
    rating: 4.97,
    reviewCount: 143,
    distanceMeters: 2210,
    bearingDegrees: 226,
    photoUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=480&q=80",
  },
  {
    id: 5,
    nickname: "정서윤",
    profession: "브랜드·UI 디자이너",
    category: "디자인",
    location: "서울 성동구",
    description:
      "초기 브랜드의 로고, 컬러 시스템, 웹 UI를 비즈니스 방향에 맞춰 설계합니다. 보기 좋은 디자인을 넘어 고객이 이해하기 쉬운 구조를 만듭니다.",
    career:
      "SaaS 프로덕트 디자이너 · 브랜드 아이덴티티 프로젝트 6년 · 웹/모바일 UI 구축 40건 이상",
    certifications: [],
    consultationMethods: ["Online"],
    snsUrl: "https://instagram.com/trupick_design",
    portfolioUrl: "https://trupick.example.com/portfolio/design",
    planType: "free",
    rating: 4.91,
    reviewCount: 84,
    distanceMeters: 3100,
    bearingDegrees: 164,
    photoUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=480&q=80",
  },
  {
    id: 6,
    nickname: "한도현",
    profession: "퍼포먼스 마케팅 컨설턴트",
    category: "마케팅",
    location: "서울 종로구",
    description:
      "광고 계정 구조, 랜딩 페이지, 전환 퍼널을 함께 진단해 낭비 예산을 줄이고 성과 지표를 개선합니다. 초기 팀도 이해할 수 있는 실행안을 제공합니다.",
    career:
      "그로스 마케팅 리드 · Meta/Google Ads 운영 8년 · 커머스 및 B2B 캠페인 컨설팅",
    certifications: ["Google Ads Search Certification"],
    consultationMethods: ["Online", "Visit"],
    snsUrl: "https://linkedin.com/company/trupick",
    portfolioUrl: "https://trupick.example.com/portfolio/marketing",
    planType: "premium",
    rating: 4.93,
    reviewCount: 112,
    distanceMeters: 4680,
    bearingDegrees: 270,
    photoUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=480&q=80",
  },
];
