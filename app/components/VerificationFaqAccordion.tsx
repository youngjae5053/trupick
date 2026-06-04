"use client";

import { useState } from "react";

export default function VerificationFaqAccordion({
  items,
}: {
  items: Array<{ question: string; answer: string }>;
}) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="mt-8 grid gap-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <article
            key={item.question}
            className="rounded-[8px] border border-[#E5E7EB] bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
            >
              <span className="text-base font-black leading-7 text-[#111111] sm:text-lg">
                Q. {item.question}
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5F1E8] text-lg font-black text-[#0F5132]">
                {isOpen ? "-" : "+"}
              </span>
            </button>
            {isOpen ? (
              <p className="border-t border-[#E5E7EB] px-5 py-5 text-sm font-bold leading-7 text-[#374151] sm:px-6 sm:text-base sm:leading-8">
                A. {item.answer}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
