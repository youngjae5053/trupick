-- TRUPICK beta seed data: fictional exercise/rehab experts only.
-- Safe to paste into the Supabase SQL Editor.

alter table public.experts
add column if not exists distance_km numeric(4, 1);

alter table public.experts
add column if not exists category text;

delete from public.experts
where name in (
  '김도윤',
  '박서연',
  '이준호',
  '최민지',
  '정하늘',
  '한지우',
  '오승현',
  '강유진',
  '윤태민',
  '서나연'
);

insert into public.experts (
  name,
  specialty,
  location,
  description,
  career,
  image_url,
  distance_km,
  plan_type,
  approved,
  approval_status,
  status,
  category,
  certifications
) values
(
  '김도윤',
  '재활운동 전문가',
  '서울 강남구',
  '수술 후 회복기와 만성 통증 고객을 위한 단계별 재활운동 프로그램을 설계합니다. 움직임 평가를 바탕으로 무리 없는 회복 루틴을 제안합니다.',
  '경력 9년. 재활운동 센터 팀장, 병원 연계 운동 프로그램 운영, 어깨·무릎 회복 케이스 다수.',
  'https://ui-avatars.com/api/?name=%EA%B9%80%EB%8F%84%EC%9C%A4&background=0F5132&color=fff&size=256&bold=true',
  1.2,
  'premium',
  true,
  'approved',
  'approved',
  '운동/재활',
  array['생활스포츠지도사', '재활운동 지도 과정 수료']
),
(
  '박서연',
  '통증관리 코치',
  '서울 서초구',
  '목, 어깨, 허리 통증을 반복하는 고객에게 생활 패턴과 움직임 습관을 함께 점검합니다. 통증 완화와 재발 방지를 목표로 합니다.',
  '경력 7년. 통증관리 전문 스튜디오 운영, 직장인 자세 개선 프로그램 400건 이상 진행.',
  'https://ui-avatars.com/api/?name=%EB%B0%95%EC%84%9C%EC%97%B0&background=111111&color=fff&size=256&bold=true',
  2.4,
  'premium',
  true,
  'approved',
  'approved',
  '운동/재활',
  array['운동처방 과정 수료', '근막이완 교육 수료']
),
(
  '이준호',
  '체형교정 트레이너',
  '서울 송파구',
  '라운드숄더, 골반 불균형, 거북목 등 체형 고민을 가진 고객에게 평가 기반 교정 운동을 제공합니다. 눈에 보이는 변화보다 지속 가능한 움직임을 우선합니다.',
  '경력 8년. 체형교정 전문 센터 근무, 자세 분석 및 교정 운동 세션 1,200회 이상.',
  'https://ui-avatars.com/api/?name=%EC%9D%B4%EC%A4%80%ED%98%B8&background=D65339&color=fff&size=256&bold=true',
  3.1,
  'free',
  true,
  'approved',
  'approved',
  '운동/재활',
  array['생활스포츠지도사', '자세평가 교육 수료']
),
(
  '최민지',
  '다이어트 전문 코치',
  '서울 마포구',
  '단기 감량보다 식습관과 운동 루틴을 함께 조정하는 현실적인 다이어트 코칭을 제공합니다. 초보자도 지속할 수 있는 계획을 중요하게 봅니다.',
  '경력 6년. 여성 체중관리 프로그램 운영, 초보자 홈트레이닝 및 식단 습관 코칭 경험 다수.',
  'https://ui-avatars.com/api/?name=%EC%B5%9C%EB%AF%BC%EC%A7%80&background=0F5132&color=fff&size=256&bold=true',
  4.5,
  'free',
  true,
  'approved',
  'approved',
  '운동/재활',
  array['퍼스널트레이닝 과정 수료', '영양 코칭 과정 수료']
),
(
  '정하늘',
  '근력향상 퍼스널 트레이너',
  '서울 용산구',
  '운동 초보부터 중급자까지 안전하게 근력을 높일 수 있도록 자세, 볼륨, 회복을 함께 관리합니다. 고객의 생활 리듬에 맞춘 루틴을 설계합니다.',
  '경력 10년. 대형 피트니스 센터 수석 트레이너, 근력 향상 및 바디 리컴포지션 코칭 전문.',
  'https://ui-avatars.com/api/?name=%EC%A0%95%ED%95%98%EB%8A%98&background=111111&color=fff&size=256&bold=true',
  2.8,
  'premium',
  true,
  'approved',
  'approved',
  '운동/재활',
  array['생활스포츠지도사', 'NSCA-CPT 교육 수료']
),
(
  '한지우',
  '러닝 코치',
  '서울 성동구',
  '러닝 입문자와 기록 향상을 원하는 러너를 대상으로 보강운동, 페이스 전략, 부상 예방 루틴을 제공합니다.',
  '경력 5년. 마라톤 클럽 코칭, 러닝 자세 분석 및 10K·하프 준비 프로그램 운영.',
  'https://ui-avatars.com/api/?name=%ED%95%9C%EC%A7%80%EC%9A%B0&background=D65339&color=fff&size=256&bold=true',
  3.7,
  'free',
  true,
  'approved',
  'approved',
  '운동/재활',
  array['러닝 지도 과정 수료', '스포츠 테이핑 교육 수료']
),
(
  '오승현',
  '파워리프팅 코치',
  '서울 영등포구',
  '스쿼트, 벤치프레스, 데드리프트의 기술 개선과 부상 예방을 중심으로 훈련 계획을 설계합니다. 기록 향상과 안정성을 함께 추구합니다.',
  '경력 8년. 파워리프팅 동호인 및 입문자 코칭, 3대 운동 자세 교정 세션 다수.',
  'https://ui-avatars.com/api/?name=%EC%98%A4%EC%8A%B9%ED%98%84&background=0F5132&color=fff&size=256&bold=true',
  5.0,
  'premium',
  true,
  'approved',
  'approved',
  '운동/재활',
  array['파워리프팅 코칭 과정 수료', '생활스포츠지도사']
),
(
  '강유진',
  '필라테스 재활 강사',
  '서울 강동구',
  '필라테스 기반의 코어 안정화와 자세 개선 프로그램을 제공합니다. 산후 회복, 허리 불편감, 체형 개선 고객을 주로 돕습니다.',
  '경력 7년. 기구 필라테스 스튜디오 리드 강사, 산후 회복 및 코어 안정화 프로그램 운영.',
  'https://ui-avatars.com/api/?name=%EA%B0%95%EC%9C%A0%EC%A7%84&background=111111&color=fff&size=256&bold=true',
  4.1,
  'free',
  true,
  'approved',
  'approved',
  '운동/재활',
  array['필라테스 지도자 과정 수료', '산전산후 운동 교육 수료']
),
(
  '윤태민',
  '스포츠 퍼포먼스 코치',
  '서울 관악구',
  '축구, 테니스, 골프 등 스포츠 활동을 즐기는 고객에게 민첩성, 순발력, 회전 안정성 향상 프로그램을 제공합니다.',
  '경력 9년. 아마추어 선수 컨디셔닝 코칭, 스포츠 퍼포먼스 향상 프로그램 운영.',
  'https://ui-avatars.com/api/?name=%EC%9C%A4%ED%83%9C%EB%AF%BC&background=D65339&color=fff&size=256&bold=true',
  6.3,
  'premium',
  true,
  'approved',
  'approved',
  '운동/재활',
  array['스포츠컨디셔닝 과정 수료', '운동처방 교육 수료']
),
(
  '서나연',
  '시니어 운동 지도자',
  '서울 노원구',
  '중장년과 시니어 고객을 대상으로 균형감각, 근감소 예방, 관절 부담을 줄이는 운동 루틴을 안내합니다.',
  '경력 11년. 시니어 센터 운동 프로그램 운영, 낙상 예방 및 기초 근력 향상 수업 다수.',
  'https://ui-avatars.com/api/?name=%EC%84%9C%EB%82%98%EC%97%B0&background=0F5132&color=fff&size=256&bold=true',
  7.8,
  'free',
  true,
  'approved',
  'approved',
  '운동/재활',
  array['노인스포츠지도 교육 수료', '생활스포츠지도사']
);
