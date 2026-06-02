import Link from "next/link";

const plans = [
  {
    name: "무료",
    label: "Free",
    price: "0원",
    tone: "light",
    features: ["기본 노출"],
  },
  {
    name: "프리미엄",
    label: "Premium",
    price: "성장형",
    tone: "dark",
    features: [
      "상단 노출",
      "AI 추천 우선",
      "PREMIUM 배지",
      "향후 광고 우선권",
    ],
  },
];

export default function FreeVsPremiumPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#111111]">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-lg font-black tracking-[0.18em] text-[#111111]"
          >
            TRUPICK
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-[#111111] px-4 py-2 text-sm font-black text-white transition hover:bg-[#0f3d2e]"
          >
            전문가 등록
          </Link>
        </header>

        <section className="pt-12 sm:pt-16">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#0f3d2e]">
            Expert plans
          </p>
          <h1 className="mt-3 max-w-4xl text-[clamp(2.45rem,8vw,5.5rem)] font-black leading-[0.92]">
            노출을 선택하고 성장 속도를 높이세요.
          </h1>
          <p className="mt-5 max-w-2xl text-base font-bold leading-8 text-[#5b675f]">
            무료 플랜으로 시작하고, 더 많은 고객에게 발견되고 싶을 때 프리미엄
            플랜으로 전환할 수 있습니다.
          </p>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          {plans.map((plan) => {
            const isPremium = plan.tone === "dark";

            return (
              <article
                key={plan.name}
                className={`rounded-[8px] border p-6 shadow-[0_24px_70px_rgba(24,24,20,0.10)] sm:p-8 ${
                  isPremium
                    ? "border-[#111111] bg-[#111111] text-white"
                    : "border-[#e6ded0] bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p
                      className={`text-xs font-black uppercase tracking-[0.18em] ${
                        isPremium ? "text-white/55" : "text-[#8a8073]"
                      }`}
                    >
                      {plan.label}
                    </p>
                    <h2 className="mt-2 text-4xl font-black">{plan.name}</h2>
                  </div>
                  {isPremium ? (
                    <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#111111]">
                      ✓ PREMIUM
                    </span>
                  ) : null}
                </div>

                <p
                  className={`mt-8 text-5xl font-black ${
                    isPremium ? "text-white" : "text-[#111111]"
                  }`}
                >
                  {plan.price}
                </p>

                <ul className="mt-8 grid gap-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className={`flex items-center gap-3 rounded-[8px] p-4 text-sm font-black ${
                        isPremium
                          ? "bg-white/10 text-white"
                          : "bg-[#f7f3ea] text-[#111111]"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                          isPremium
                            ? "bg-white text-[#111111]"
                            : "bg-[#111111] text-white"
                        }`}
                      >
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`mt-8 block rounded-full px-5 py-4 text-center text-sm font-black transition ${
                    isPremium
                      ? "bg-white text-[#111111] hover:bg-[#f7f3ea]"
                      : "bg-[#111111] text-white hover:bg-[#0f3d2e]"
                  }`}
                >
                  {isPremium ? "프리미엄으로 시작" : "무료로 시작"}
                </Link>
              </article>
            );
          })}
        </section>

        <section className="mt-5 rounded-[8px] border border-[#e6ded0] bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a8073]">
                Recommendation
              </p>
              <h2 className="mt-2 text-2xl font-black">
                막 시작했다면 무료, 빠른 고객 확보가 목표라면 프리미엄을 추천합니다.
              </h2>
            </div>
            <Link
              href="/experts"
              className="rounded-full border border-[#ddd8ce] px-5 py-3 text-center text-sm font-black text-[#111111] transition hover:border-[#111111]"
            >
              전문가 노출 예시 보기
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
