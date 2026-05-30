"use client";

import { ArrowLeft, CheckCircle, Copy } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { FOOD_CATEGORIES } from "@/lib/data";

type Step = "form" | "add-items" | "done";

type CreatedVenue = {
  id: string;
  slug: string;
  claim_token: string;
};

export default function ListYourPlace() {
  const [step, setStep] = useState<Step>("form");
  const [venue, setVenue] = useState<CreatedVenue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Item form state
  const [items, setItems] = useState<Array<{ name: string; price: string; category: string; isDeal: boolean; dealNote: string }>>([]);
  const [newItem, setNewItem] = useState({ name: "", price: "", category: "", isDeal: false, dealNote: "" });
  const [addingItem, setAddingItem] = useState(false);

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
      setVenue(data);
      setStep("add-items");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function addItem() {
    if (!venue || !newItem.name.trim() || !newItem.price) return;
    setAddingItem(true);
    try {
      const res = await fetch(`/api/food/venues/${venue.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${venue.claim_token}` },
        body: JSON.stringify({
          name: newItem.name.trim(),
          price: Number(newItem.price),
          category: newItem.category || null,
          isDeal: newItem.isDeal,
          dealNote: newItem.dealNote || null,
        }),
      });
      if (res.ok) {
        setItems((prev) => [...prev, { ...newItem }]);
        setNewItem({ name: "", price: "", category: "", isDeal: false, dealNote: "" });
      }
    } finally {
      setAddingItem(false);
    }
  }

  function copyToken() {
    if (!venue) return;
    navigator.clipboard.writeText(venue.claim_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-dvh bg-[#f7efe0]">
      <header className="sticky top-0 z-40 border-b border-[#2f2417]/10 bg-[#ff6b35] px-4 py-3">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <Link href="/food" className="grid h-8 w-8 place-items-center rounded-md bg-white/20 text-white">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="font-black text-white leading-tight">
              {step === "form" ? "List your place" : step === "add-items" ? "Add menu items" : "You're live!"}
            </p>
            <p className="text-xs text-white/70">Free · no account needed</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6">
        {/* Step 1: venue details */}
        {step === "form" && (
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
                  <input name="phone" type="tel" placeholder="09 123 4567" className="control mt-1 w-full" />
                </label>
                <label className="block">
                  <span className="text-sm font-black text-black/60">Website</span>
                  <input name="website" type="url" placeholder="https://yourcafe.co.nz" className="control mt-1 w-full" />
                </label>
              </div>
            </div>

            {error && <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="button w-full justify-center bg-[#ff6b35] text-white shadow-[3px_3px_0_#2f2417] disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Continue — add your menu →"}
            </button>

            <p className="text-center text-xs text-black/40">
              By listing you agree to keep prices accurate. This is free advertising — no fees, ever.
            </p>
          </form>
        )}

        {/* Step 2: add items */}
        {step === "add-items" && venue && (
          <div className="grid gap-4">
            <div className="rounded-xl border-2 border-[#245c3b]/30 bg-[#edf7ef] p-4">
              <p className="font-black text-[#245c3b]">✓ {venue.slug.split("-").slice(0, -1).join(" ")} is live!</p>
              <p className="mt-1 text-sm text-[#245c3b]/80">Now add your menu items and deals — people nearby will see them.</p>
            </div>

            {/* Claim token */}
            <div className="rounded-xl border-2 border-[#2f2417]/10 bg-white p-4">
              <p className="text-sm font-black text-black/60 mb-1">Your edit token — save this somewhere safe</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-black/5 px-3 py-2 text-xs font-mono break-all">{venue.claim_token}</code>
                <button onClick={copyToken} className="grid h-8 w-8 flex-shrink-0 place-items-center rounded border border-black/10 bg-white text-[#245c3b]">
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-black/40">You&apos;ll need this to add or remove items later.</p>
            </div>

            {/* Added items so far */}
            {items.length > 0 && (
              <div className="rounded-xl border-2 border-[#2f2417]/10 bg-white p-4">
                <p className="text-sm font-black mb-2">Added ({items.length})</p>
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between py-1.5 border-b border-black/5 last:border-0 text-sm">
                    <span className="font-bold">{item.name} {item.isDeal && <span className="text-[#ff6b35]">🔥</span>}</span>
                    <span className="font-black text-[#245c3b]">${Number(item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* New item form */}
            <div className="rounded-xl border-2 border-[#2f2417]/10 bg-white p-4">
              <p className="font-black mb-3">Add an item</p>
              <div className="grid gap-2">
                <input
                  value={newItem.name}
                  onChange={(e) => setNewItem((v) => ({ ...v, name: e.target.value }))}
                  placeholder="Item name (e.g. Butter chicken)"
                  className="control w-full"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={newItem.price}
                    onChange={(e) => setNewItem((v) => ({ ...v, price: e.target.value }))}
                    type="number" min="0" step="0.5" placeholder="Price $"
                    className="control w-full"
                  />
                  <input
                    value={newItem.category}
                    onChange={(e) => setNewItem((v) => ({ ...v, category: e.target.value }))}
                    placeholder="Category (optional)"
                    className="control w-full"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={newItem.isDeal}
                    onChange={(e) => setNewItem((v) => ({ ...v, isDeal: e.target.checked }))}
                    className="accent-[#ff6b35]"
                  />
                  This is a deal / special
                </label>
                {newItem.isDeal && (
                  <input
                    value={newItem.dealNote}
                    onChange={(e) => setNewItem((v) => ({ ...v, dealNote: e.target.value }))}
                    placeholder="Deal note (e.g. Lunch special 11am–2pm)"
                    className="control w-full"
                  />
                )}
                <button
                  onClick={addItem}
                  disabled={addingItem || !newItem.name.trim() || !newItem.price}
                  className="button bg-[#245c3b] text-white disabled:opacity-50"
                >
                  {addingItem ? "Saving..." : "+ Add item"}
                </button>
              </div>
            </div>

            <button
              onClick={() => setStep("done")}
              className="button w-full justify-center bg-[#ff6b35] text-white shadow-[3px_3px_0_#2f2417]"
            >
              {items.length === 0 ? "Skip for now — I'll add items later" : "Done — view my listing →"}
            </button>
          </div>
        )}

        {/* Step 3: done */}
        {step === "done" && (
          <div className="grid gap-4 text-center">
            <p className="text-6xl">🎉</p>
            <h2 className="text-2xl font-black">You&apos;re on the map!</h2>
            <p className="text-black/60">People near you can now find your place and see your menu.</p>
            <Link href="/food" className="button justify-center bg-[#ff6b35] text-white shadow-[3px_3px_0_#2f2417]">
              Browse mealspy →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
