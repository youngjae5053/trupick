import Link from "next/link";

const reviews = [
  {
    name: "김서연",
    category: "운동/재활",
    text: "가까운 재활 전문가를 빠르게 찾았고, 첫 상담 전에 프로필을 충분히 확인할 수 있어 안심됐습니다.",
  },
  {
    name: "박준호",
    category: "세무",
    text: "전문 분야와 상담 방식이 명확하게 보여서 제 상황에 맞는 전문가를 고르기 쉬웠습니다.",
  },
  {
    name: "이하린",
    category: "디자인",
    text: "포트폴리오와 후기 중심으로 비교할 수 있어 상담 요청까지 부담이 적었습니다.",
  },
];

export default function ReviewsPage() {
  return (
    <main className="min-h-screen bg-[#F5F1E8] px-4 py-6 text-[#111111] sm:px-6 lg:px-10">
      <section className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="text-sm font-black text-[#0F5132] underline underline-offset-4"
        >
          홈으로
        </Link>
        <div className="mt-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
            Reviews
          </p>
          <h1 className="mt-3 text-4xl font-black">TRUPICK 베타 후기</h1>
          <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-[#4B5563]">
            초기 사용자들이 전문가 탐색과 상담 요청 흐름을 체험하며 남긴 후기입니다.
          </p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {reviews.map((review) => (
            <article
              key={review.name}
              className="rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-black text-[#0F5132]">{review.category}</p>
              <p className="mt-5 text-base font-black leading-8">“{review.text}”</p>
              <p className="mt-5 text-sm font-bold text-[#4B5563]">{review.name}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
