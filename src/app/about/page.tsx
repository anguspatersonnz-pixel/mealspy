import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#f5f5f5]">
      <header className="sticky top-0 z-40 bg-white border-b border-[#ece8e3]">
        <div className="mx-auto w-full max-w-7xl px-4 flex h-14 items-center gap-3">
          <Link href="/" className="rounded-xl border border-[#ece8e3] p-2 text-[#6b6560]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          </Link>
          <span className="text-lg font-black tracking-tight text-[#1a1714]">🍜 mealspy</span>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 space-y-6">
        <div className="rounded-2xl bg-white border border-[#ece8e3] px-6 py-8">
          <h1 className="text-2xl font-black text-[#1a1714] mb-4">About mealspy</h1>
          <p className="text-sm leading-relaxed text-[#6b6560]">
            Ever rocked up somewhere new and had no idea what was around you — let alone what was cheap? That&apos;s exactly why we built mealspy.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[#6b6560]">
            Whether you&apos;re on lunch, exploring a new suburb, or just trying not to blow your budget, we surface the best value food and deals near you in seconds. No ads, no fluff — just what&apos;s nearby and how much it costs.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[#6b6560]">
            Venues list directly on mealspy, so prices are real and up to date. Save your favourites, compare deals, and check directions before you even leave your seat.
          </p>
          <p className="mt-6 text-sm font-semibold text-[#1a1714]">Two mates working hard to save your credit card. 💳</p>
        </div>
      </main>
    </div>
  );
}
