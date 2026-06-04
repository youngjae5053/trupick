"use client";

import { useState } from "react";

export function PreparedAlertButton({
  children,
  message,
  className,
}: {
  children: React.ReactNode;
  message: string;
  className: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.alert(message)}
      className={className}
    >
      {children}
    </button>
  );
}

export function ExpertQnaAccordion({
  items,
}: {
  items: Array<{ question: string; answer: string }>;
}) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="mt-6 grid gap-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <article
            key={item.question}
            className="rounded-[8px] border border-[#E5E7EB] bg-[#FBFAF7]"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-base font-black leading-7 text-[#111111]">
                {item.question}
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-lg font-black text-[#0F5132]">
                {isOpen ? "-" : "+"}
              </span>
            </button>
            {isOpen ? (
              <p className="border-t border-[#E5E7EB] px-5 py-4 text-sm font-bold leading-7 text-[#374151]">
                {item.answer}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
