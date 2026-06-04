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
  specialtyTags: string[];
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
    nickname: "최우찬",
    profession: "운동재활 전문가",
    category: "운동/재활",
    location: "서울 강남구",
    description:
      "병원 재활팀과 운동센터 현장 경험을 바탕으로 통증 이력, 움직임 패턴, 생활 습관을 함께 분석합니다. 무리한 운동보다 회복 가능한 루틴과 단계별 운동처방을 우선합니다.",
    career:
      "정형외과 재활팀 5년 · 프라이빗 운동센터 운영 4년 · 체형교정 및 통증관리 상담 1,400건",
    certifications: ["물리치료사", "운동처방사", "생활스포츠지도사"],
    specialtyTags: ["재활운동", "통증관리", "체형교정", "운동처방", "기능회복"],
    consultationMethods: ["Visit", "Center", "Online"],
    snsUrl: "https://instagram.com/trupick_rehab_choi",
    portfolioUrl: "https://trupick.example.com/experts/1",
    planType: "premium",
    rating: 4.89,
    reviewCount: 325,
    distanceMeters: 420,
    bearingDegrees: 38,
    photoUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=480&q=80",
  },
  {
    id: 2,
    nickname: "김도윤",
    profession: "퍼스널 트레이닝 코치",
    category: "운동/재활",
    location: "서울 성동구",
    description:
      "운동을 처음 시작하는 직장인과 1인 사업자를 대상으로 체력 평가, 자세 분석, 주 2회 루틴 설계를 제공합니다. 체중 감량보다 지속 가능한 체력 회복을 중요하게 봅니다.",
    career:
      "프리미엄 PT 스튜디오 헤드코치 · 기업 임직원 건강관리 프로그램 6년 · 개인 맞춤 운동 지도 900건",
    certifications: ["NSCA-CPT", "생활스포츠지도사", "FMS Level 1"],
    specialtyTags: ["PT/퍼스널트레이닝", "근력향상", "자세교정", "스트레칭"],
    consultationMethods: ["Center", "Visit", "Online"],
    snsUrl: "https://instagram.com/trupick_pt_kim",
    portfolioUrl: "https://trupick.example.com/experts/2",
    planType: "premium",
    rating: 4.92,
    reviewCount: 188,
    distanceMeters: 760,
    bearingDegrees: 72,
    photoUrl:
      "https://images.unsplash.com/photo-1587340899745-2cfddc61a17a?auto=format&fit=crop&w=480&q=80",
  },
  {
    id: 3,
    nickname: "박서연",
    profession: "필라테스 재활 트레이너",
    category: "운동/재활",
    location: "서울 송파구",
    description:
      "골반 정렬, 코어 안정화, 호흡 패턴을 중심으로 여성 직장인과 산후 회복 고객의 움직임을 개선합니다. 상담 후 집에서 이어갈 수 있는 보조 루틴까지 제공합니다.",
    career:
      "재활 필라테스 센터 리드 강사 · 산후 회복 프로그램 5년 · 체형교정 그룹 클래스 운영",
    certifications: ["재활필라테스 지도자", "산전산후 운동 지도", "생활스포츠지도사"],
    specialtyTags: ["필라테스", "체형교정", "스트레칭", "기능회복"],
    consultationMethods: ["Center", "Online"],
    snsUrl: "https://instagram.com/trupick_pilates_park",
    portfolioUrl: "https://trupick.example.com/experts/3",
    planType: "free",
    rating: 4.86,
    reviewCount: 142,
    distanceMeters: 1180,
    bearingDegrees: 132,
    photoUrl:
      "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=480&q=80",
  },
  {
    id: 4,
    nickname: "이현우",
    profession: "통증관리 운동 코치",
    category: "운동/재활",
    location: "서울 마포구",
    description:
      "목, 어깨, 허리 통증을 겪는 사무직 고객을 대상으로 움직임 평가와 생활 자세 교정을 진행합니다. 통증 완화 이후 재발 방지 루틴까지 함께 설계합니다.",
    career:
      "스포츠재활센터 코치 · 근골격계 통증관리 프로그램 7년 · 기업 자세교정 워크숍 진행",
    certifications: ["건강운동관리사", "KACEP 운동사", "교정운동 전문가"],
    specialtyTags: ["통증관리", "재활운동", "스트레칭", "기능회복"],
    consultationMethods: ["Visit", "Center"],
    snsUrl: "https://instagram.com/trupick_paincare",
    portfolioUrl: "https://trupick.example.com/experts/4",
    planType: "premium",
    rating: 4.9,
    reviewCount: 211,
    distanceMeters: 1620,
    bearingDegrees: 226,
    photoUrl:
      "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=480&q=80",
  },
  {
    id: 5,
    nickname: "정민아",
    profession: "기능회복 운동 전문가",
    category: "운동/재활",
    location: "서울 용산구",
    description:
      "수술 이후 일상 복귀, 부상 후 운동 재개, 장기 통증으로 중단된 활동 회복을 돕습니다. 안전한 단계 설정과 기록 기반 피드백을 중요하게 운영합니다.",
    career:
      "대학병원 운동재활실 · 시니어 기능회복 프로그램 6년 · 재활운동 개인 세션 800건",
    certifications: ["운동처방사", "건강운동관리사", "CPR/AED"],
    specialtyTags: ["기능회복", "재활운동", "운동처방", "스트레칭"],
    consultationMethods: ["Center", "Online"],
    snsUrl: null,
    portfolioUrl: "https://trupick.example.com/experts/5",
    planType: "free",
    rating: 4.84,
    reviewCount: 96,
    distanceMeters: 2380,
    bearingDegrees: 164,
    photoUrl:
      "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?auto=format&fit=crop&w=480&q=80",
  },
  {
    id: 6,
    nickname: "박민정",
    profession: "개인사업자 전문 세무사",
    category: "세무",
    location: "서울 송파구",
    description:
      "프리랜서와 소규모 사업자의 종합소득세, 부가세, 인건비 신고를 체계적으로 관리합니다. 사업 구조에 맞는 절세 체크리스트와 신고 일정을 함께 제공합니다.",
    career:
      "세무법인 팀장 출신 · 개인사업자 세무 자문 10년 · 누적 신고 1,200건 이상",
    certifications: ["세무사", "한국세무사회 등록", "전산세무 1급"],
    specialtyTags: ["종합소득세", "부가세", "사업자 세무", "프리랜서 세무", "절세 상담"],
    consultationMethods: ["Online", "Visit"],
    snsUrl: null,
    portfolioUrl: "https://trupick.example.com/experts/6",
    planType: "premium",
    rating: 4.94,
    reviewCount: 198,
    distanceMeters: 890,
    bearingDegrees: 302,
    photoUrl:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=480&q=80",
  },
  {
    id: 7,
    nickname: "윤태섭",
    profession: "법인·스타트업 세무 컨설턴트",
    category: "세무",
    location: "서울 강남구",
    description:
      "초기 법인의 세무 구조, 비용 처리, 법인세 신고, 투자 이후 회계 정리를 지원합니다. 대표가 이해할 수 있는 언어로 리스크와 절세 포인트를 설명합니다.",
    career:
      "회계법인 세무본부 · 스타트업 법인세 자문 8년 · 투자유치 이후 회계 정비 프로젝트 다수",
    certifications: ["세무사", "공인회계사 1차 합격", "더존 Smart A 컨설턴트"],
    specialtyTags: ["법인세", "사업자 세무", "절세 상담", "세무조사"],
    consultationMethods: ["Online", "Visit"],
    snsUrl: "https://linkedin.com/company/trupick-tax",
    portfolioUrl: "https://trupick.example.com/experts/7",
    planType: "premium",
    rating: 4.91,
    reviewCount: 121,
    distanceMeters: 1320,
    bearingDegrees: 18,
    photoUrl:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=480&q=80",
  },
  {
    id: 8,
    nickname: "한지수",
    profession: "프리랜서 세무 상담사",
    category: "세무",
    location: "서울 마포구",
    description:
      "디자이너, 크리에이터, 강사 등 프리랜서의 소득 신고와 비용 정리를 돕습니다. 매월 기록할 항목과 신고 전 준비 서류를 간단한 체크리스트로 제공합니다.",
    career:
      "개인 납세자 세무 상담 7년 · 프리랜서 종합소득세 신고 900건 · 플랫폼 노동자 세무 가이드 운영",
    certifications: ["세무사", "전산회계 1급", "한국세무사회 등록"],
    specialtyTags: ["프리랜서 세무", "종합소득세", "부가세", "절세 상담"],
    consultationMethods: ["Online"],
    snsUrl: null,
    portfolioUrl: "https://trupick.example.com/experts/8",
    planType: "free",
    rating: 4.87,
    reviewCount: 88,
    distanceMeters: 2180,
    bearingDegrees: 248,
    photoUrl:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=480&q=80",
  },
  {
    id: 9,
    nickname: "이준호",
    profession: "계약·분쟁 자문 변호사",
    category: "법률",
    location: "서울 서초구",
    description:
      "계약서 검토, 소상공인 분쟁, 생활 법률 상담을 명확한 언어로 안내합니다. 상담 후 바로 실행할 수 있는 대응 순서와 필요 서류를 정리해드립니다.",
    career:
      "법무법인 기업자문팀 · 계약 검토 및 민사 분쟁 경력 9년 · 대한변호사협회 등록",
    certifications: ["변호사", "대한변호사협회 등록", "서울지방변호사회 회원"],
    specialtyTags: ["계약 검토", "민사", "생활 법률", "창업 법률"],
    consultationMethods: ["Online", "Visit"],
    snsUrl: null,
    portfolioUrl: "https://trupick.example.com/experts/9",
    planType: "premium",
    rating: 4.89,
    reviewCount: 176,
    distanceMeters: 1380,
    bearingDegrees: 116,
    photoUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=480&q=80",
  },
  {
    id: 10,
    nickname: "강소민",
    profession: "노동·부동산 생활법률 변호사",
    category: "법률",
    location: "서울 중구",
    description:
      "근로계약, 임대차, 보증금, 생활 분쟁처럼 일상에서 자주 발생하는 법률 문제를 현실적인 대응 순서로 정리합니다. 상담 후 문서 체크 포인트를 제공합니다.",
    career:
      "공익 법률상담센터 4년 · 노동 및 임대차 사건 수행 6년 · 생활법률 교육 강의",
    certifications: ["변호사", "공인노무사 1차 합격", "대한변호사협회 등록"],
    specialtyTags: ["노동", "부동산", "생활 법률", "민사"],
    consultationMethods: ["Online", "Visit"],
    snsUrl: null,
    portfolioUrl: "https://trupick.example.com/experts/10",
    planType: "free",
    rating: 4.82,
    reviewCount: 73,
    distanceMeters: 2840,
    bearingDegrees: 338,
    photoUrl:
      "https://images.unsplash.com/photo-1590650153855-d9e808231d41?auto=format&fit=crop&w=480&q=80",
  },
  {
    id: 11,
    nickname: "정서윤",
    profession: "브랜드·UI 디자이너",
    category: "디자인",
    location: "서울 성동구",
    description:
      "초기 브랜드의 로고, 컬러 시스템, 웹 UI를 비즈니스 방향에 맞춰 설계합니다. 보기 좋은 디자인을 넘어 고객이 이해하기 쉬운 구조를 만듭니다.",
    career:
      "SaaS 프로덕트 디자이너 · 브랜드 아이덴티티 프로젝트 6년 · 웹/모바일 UI 구축 40건 이상",
    certifications: ["UX 디자인 전문가 과정", "Figma Advanced", "브랜드 전략 워크숍 수료"],
    specialtyTags: ["로고", "브랜딩", "UI/UX", "상세페이지", "SNS 디자인"],
    consultationMethods: ["Online", "Visit"],
    snsUrl: "https://instagram.com/trupick_design",
    portfolioUrl: "https://trupick.example.com/portfolio/design",
    planType: "premium",
    rating: 4.91,
    reviewCount: 184,
    distanceMeters: 3100,
    bearingDegrees: 164,
    photoUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=480&q=80",
  },
  {
    id: 12,
    nickname: "오세진",
    profession: "커머스 상세페이지 디자이너",
    category: "디자인",
    location: "서울 구로구",
    description:
      "제품 상세페이지, SNS 소재, 브랜드 배너를 전환 관점에서 설계합니다. 기획 문서가 부족한 초기 판매자도 상품 강점 정리부터 디자인까지 함께 진행합니다.",
    career:
      "이커머스 디자인팀 리드 · 상세페이지 제작 300건 · 뷰티/생활용품 브랜드 디자인",
    certifications: ["시각디자인 산업기사", "Adobe Certified Professional"],
    specialtyTags: ["상세페이지", "SNS 디자인", "포스터", "브랜딩"],
    consultationMethods: ["Online"],
    snsUrl: "https://instagram.com/trupick_commerce_design",
    portfolioUrl: "https://trupick.example.com/experts/12",
    planType: "free",
    rating: 4.85,
    reviewCount: 69,
    distanceMeters: 4120,
    bearingDegrees: 205,
    photoUrl:
      "https://images.unsplash.com/photo-1589571894960-20bbe2828d0a?auto=format&fit=crop&w=480&q=80",
  },
  {
    id: 13,
    nickname: "한도현",
    profession: "퍼포먼스 마케팅 컨설턴트",
    category: "마케팅",
    location: "서울 종로구",
    description:
      "광고 계정 구조, 랜딩 페이지, 전환 퍼널을 함께 진단해 낭비 예산을 줄이고 성과 지표를 개선합니다. 초기 팀도 이해할 수 있는 실행안을 제공합니다.",
    career:
      "그로스 마케팅 리드 · Meta/Google Ads 운영 8년 · 커머스 및 B2B 캠페인 컨설팅",
    certifications: ["Google Ads Search Certification", "Meta Blueprint", "GA4 Certification"],
    specialtyTags: ["퍼포먼스 광고", "콘텐츠 전략", "상세페이지 기획", "인스타그램"],
    consultationMethods: ["Online", "Visit"],
    snsUrl: "https://linkedin.com/company/trupick",
    portfolioUrl: "https://trupick.example.com/portfolio/marketing",
    planType: "premium",
    rating: 4.93,
    reviewCount: 212,
    distanceMeters: 4680,
    bearingDegrees: 270,
    photoUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=480&q=80",
  },
  {
    id: 14,
    nickname: "문채린",
    profession: "콘텐츠·브랜딩 마케터",
    category: "마케팅",
    location: "서울 마포구",
    description:
      "인스타그램, 블로그, 뉴스레터를 중심으로 브랜드 메시지와 콘텐츠 운영 체계를 만듭니다. 작은 팀도 유지할 수 있는 월간 콘텐츠 캘린더를 설계합니다.",
    career:
      "브랜드 마케팅 매니저 · D2C 브랜드 콘텐츠 전략 7년 · SNS 캠페인 및 블로그 SEO 운영",
    certifications: ["콘텐츠 마케팅 전문가 과정", "Google Analytics", "브랜드 전략 워크숍 수료"],
    specialtyTags: ["인스타그램", "블로그", "콘텐츠 전략", "브랜딩"],
    consultationMethods: ["Online"],
    snsUrl: "https://instagram.com/trupick_content",
    portfolioUrl: "https://trupick.example.com/experts/14",
    planType: "free",
    rating: 4.88,
    reviewCount: 104,
    distanceMeters: 1940,
    bearingDegrees: 286,
    photoUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=480&q=80",
  },
  {
    id: 15,
    nickname: "임하늘",
    profession: "직장인 심리상담사",
    category: "심리상담",
    location: "서울 강남구",
    description:
      "번아웃, 관계 스트레스, 커리어 불안을 겪는 직장인을 대상으로 감정 정리와 실행 가능한 회복 계획을 함께 세웁니다. 상담은 안정감과 실용성을 함께 지향합니다.",
    career:
      "상담심리센터 상담사 8년 · 직장인 번아웃 프로그램 운영 · 개인상담 1,000회 이상",
    certifications: ["상담심리사 2급", "임상심리사 2급", "직업상담사 2급"],
    specialtyTags: ["번아웃", "커리어 고민", "스트레스 관리", "마음 건강"],
    consultationMethods: ["Online", "Center"],
    snsUrl: null,
    portfolioUrl: "https://trupick.example.com/experts/15",
    planType: "premium",
    rating: 4.9,
    reviewCount: 158,
    distanceMeters: 1460,
    bearingDegrees: 58,
    photoUrl:
      "https://images.unsplash.com/photo-1551836022-b06985bceb24?auto=format&fit=crop&w=480&q=80",
  },
  {
    id: 16,
    nickname: "서유진",
    profession: "관계·자존감 상담 전문가",
    category: "심리상담",
    location: "서울 성북구",
    description:
      "대인관계에서 반복되는 패턴, 자존감 저하, 감정 소진을 차분히 다룹니다. 상담 이후 일상에서 적용할 수 있는 대화 연습과 기록 방법을 제안합니다.",
    career:
      "청년 상담센터 6년 · 관계 회복 그룹상담 운영 · 자존감 향상 프로그램 진행",
    certifications: ["청소년상담사 2급", "상담심리사 2급", "가족상담 과정 수료"],
    specialtyTags: ["관계 상담", "자존감", "마음 건강", "스트레스 관리"],
    consultationMethods: ["Online", "Center"],
    snsUrl: null,
    portfolioUrl: "https://trupick.example.com/experts/16",
    planType: "free",
    rating: 4.83,
    reviewCount: 82,
    distanceMeters: 3860,
    bearingDegrees: 12,
    photoUrl:
      "https://images.unsplash.com/photo-1551836022-4c4c79ecde51?auto=format&fit=crop&w=480&q=80",
  },
];
