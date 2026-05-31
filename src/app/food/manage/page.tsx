"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ManagePage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = token.trim();
    if (!t) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/food/manage?token=${encodeURIComponent(t)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Not found");
      router.push(`/food/venues/${data.slug}/edit?token=${encodeURIComponent(t)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#faf9f7]">
      <header className="sticky top-0 z-40 border-b border-[#ece8e3] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-3.5">
          <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ece8e3] bg-white text-[#6b6560] hover:text-[#1a1714] transition">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-sm font-semibold text-[#1a1714]">Manage your listing</p>
            <p className="text-xs text-[#a09c98]">Edit prices, menu items & deals</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-10">
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <h1 className="text-base font-semibold text-[#1a1714]">Enter your edit token</h1>
            <p className="mt-1 text-sm text-[#a09c98]">
              You received this when you listed your place. Check the confirmation page or any emails you saved.
            </p>
          </div>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your token here"
            className="control w-full font-mono text-sm"
            autoFocus
          />
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <button type="submit" disabled={loading || !token.trim()} className="btn-primary w-full disabled:opacity-50">
            {loading ? "Finding your listing…" : "Go to my listing →"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#a09c98]">
          Lost your token?{" "}
          <a href="mailto:cheapernz@gmail.com" className="underline hover:text-[#e8472a]">
            Contact us
          </a>{" "}
          and we&apos;ll help you recover access.
        </p>
      </main>
    </div>
  );
}
