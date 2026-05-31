"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { FOOD_CATEGORIES } from "@/lib/data";

export default function ListYourPlace() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submitVenue(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/food/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          category: form.get("category"),
          address: form.get("address"),
          suburb: form.get("suburb"),
          city: form.get("city"),
          phone: form.get("phone"),
          website: form.get("website"),
          description: form.get("description"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      // Go straight to the edit page — owners can add menu immediately
      router.push(`/food/venues/${data.slug}/edit?token=${data.claim_token}&new=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#f7efe0]">
      <header className="sticky top-0 z-40 border-b border-[#2f2417]/10 bg-[#ff6b35] px-4 py-3">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <Link href="/food" className="grid h-8 w-8 place-items-center rounded-md bg-white/20 text-white">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="font-black text-white leading-tight">List your place</p>
            <p className="text-xs text-white/70">Free · no account needed</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6">
        <form onSubmit={submitVenue} className="grid gap-4">
          <div className="rounded-xl border-2 border-[#2f2417]/10 bg-white p-5 shadow-sm">
            <h2 className="font-black text-lg mb-4">About your place</h2>
            <div className="grid gap-3">
              <label className="block">
                <span className="text-sm font-black text-black/60">Business name *</span>
                <input name="name" required placeholder="e.g. Corner Dairy Café" className="control mt-1 w-full" />
              </label>
              <label className="block">
                <span className="text-sm font-black text-black/60">Type *</span>
                <select name="category" required className="control mt-1 w-full">
                  {FOOD_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-black text-black/60">Short description</span>
                <input name="description" placeholder="e.g. Cheap lunch specials daily" className="control mt-1 w-full" />
              </label>
            </div>
          </div>

          <div className="rounded-xl border-2 border-[#2f2417]/10 bg-white p-5 shadow-sm">
            <h2 className="font-black text-lg mb-4">Location</h2>
            <div className="grid gap-3">
              <label className="block">
                <span className="text-sm font-black text-black/60">Street address</span>
                <input name="address" placeholder="123 Main Street" className="control mt-1 w-full" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-black text-black/60">Suburb</span>
                  <input name="suburb" placeholder="Grey Lynn" className="control mt-1 w-full" />
                </label>
                <label className="block">
                  <span className="text-sm font-black text-black/60">City *</span>
                  <input name="city" required placeholder="Auckland" className="control mt-1 w-full" />
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-xl border-2 border-[#2f2417]/10 bg-white p-5 shadow-sm">
            <h2 className="font-black text-lg mb-4">Contact (optional)</h2>
            <div className="grid gap-3">
              <label className="block">
                <span className="text-sm font-black text-black/60">Phone</span>
                <input name="phone" type="text" placeholder="09 123 4567" className="control mt-1 w-full" />
              </label>
              <label className="block">
                <span className="text-sm font-black text-black/60">Website</span>
                <input name="website" type="text" placeholder="yourcafe.co.nz" className="control mt-1 w-full" />
              </label>
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="button w-full justify-center bg-[#ff6b35] text-white shadow-[3px_3px_0_#2f2417] disabled:opacity-60"
          >
            {submitting ? "Creating your listing…" : "List my place →"}
          </button>

          <p className="text-center text-xs text-black/40">
            Free · no account needed · you&apos;ll get a private link to edit your menu anytime
          </p>
        </form>
      </main>
    </div>
  );
}
