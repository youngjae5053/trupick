import Link from "next/link";

export default function MyConsultationsPage() {
  return (
    <main className="min-h-screen bg-[#F5F1E8] px-4 py-10 text-[#111111] sm:px-6 lg:px-10">
      <section className="mx-auto max-w-3xl rounded-[8px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F5132]">
          My Consultations
        </p>
        <h1 className="mt-3 text-4xl font-black">내 상담</h1>
        <p className="mt-4 text-sm font-bold leading-7 text-[#4B5563]">
          상담 신청 내역을 확인하는 공간입니다. 베타 기간에는 상담 요청 후
          관리자가 확인한 내역을 순차적으로 연결할 예정입니다.
        </p>
        <div className="mt-6 rounded-[8px] bg-[#FBFAF7] p-5 text-sm font-bold leading-7 text-[#4B5563]">
          아직 표시할 상담 내역이 없습니다.
        </div>
        <Link
          href="/experts"
          className="mt-6 inline-flex rounded-full bg-[#0F5132] px-6 py-3 text-sm font-black text-white"
        >
          전문가 찾기
        </Link>
      </section>
    </main>
  );
}
