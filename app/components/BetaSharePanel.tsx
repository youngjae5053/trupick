"use client";

import { useMemo, useState } from "react";

export default function BetaSharePanel() {
  const [copied, setCopied] = useState(false);
  const serviceUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "https://trupick.com/beta";
    }

    return `${window.location.origin}/beta`;
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(serviceUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      alert("링크 복사에 실패했습니다. 주소를 직접 복사해주세요.");
    }
  }

  return (
    <section className="mt-8 rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
            Share Beta
          </p>
          <h2 className="mt-3 text-3xl font-black">베타 테스트 링크 공유</h2>
          <p className="mt-3 text-sm font-bold leading-7 text-[#4B5563]">
            주변에 TRUPICK을 먼저 체험해볼 분이 있다면 베타 링크를 공유해주세요.
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <div className="min-h-12 flex-1 rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] px-4 py-3 text-sm font-bold text-[#111111]">
              {serviceUrl}
            </div>
            <button
              type="button"
              onClick={copyLink}
              className="rounded-full bg-[#111111] px-6 py-3 text-sm font-black text-white transition hover:bg-[#333333]"
            >
              {copied ? "복사 완료" : "링크 복사"}
            </button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[220px] rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7] p-4">
          <div
            aria-label="QR 코드 준비 영역"
            className="grid aspect-square grid-cols-5 gap-2 rounded-[8px] bg-white p-3"
          >
            {Array.from({ length: 25 }).map((_, index) => (
              <span
                key={index}
                className={`rounded-[2px] ${
                  [0, 1, 2, 5, 10, 12, 14, 18, 20, 21, 22, 24].includes(index)
                    ? "bg-[#111111]"
                    : "bg-[#E5E7EB]"
                }`}
              />
            ))}
          </div>
          <p className="mt-3 text-center text-xs font-black text-[#6B7280]">
            QR 코드 영역
          </p>
        </div>
      </div>
    </section>
  );
}
