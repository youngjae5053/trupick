"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ConsultationRequestFlow from "@/app/components/ConsultationRequestFlow";

function RequestContent() {
  const searchParams = useSearchParams();
  const expertId = searchParams.get("expertId");

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-4 py-6 text-[#111111] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/experts"
          className="inline-flex rounded-full border border-[#ded8ce] bg-white px-4 py-2 text-sm font-black text-[#0f3d2e] shadow-sm"
        >
          전문가 목록으로
        </Link>

        <div className="mt-6">
          <ConsultationRequestFlow
            expertId={expertId ? Number(expertId) : null}
            variant="embedded"
          />
        </div>
      </div>
    </main>
  );
}

export default function RequestPage() {
  return (
    <Suspense
      fallback={<main className="min-h-screen bg-[#f7f5ef]" />}
    >
      <RequestContent />
    </Suspense>
  );
}
