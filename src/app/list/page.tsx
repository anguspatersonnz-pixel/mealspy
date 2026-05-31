"use client";

import { ArrowLeft, CheckCircle, Copy, ImagePlus, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { FOOD_CATEGORIES } from "@/lib/data";

type Step = "form" | "add-items" | "done";
type CreatedVenue = { id: string; slug: string; claim_token: string };

export default function ListYourPlace() {
  const [step, setStep] = useState<Step>("form");
  const [venue, setVenue] = useState<CreatedVenue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Item form
  const [items, setItems] = useState<Array<{ name: string; price: string; isDeal: boolean; dealNote: string }>>([]);
  const [newItem, setNewItem] = useState({ name: "", price: "", category: "", isDeal: false, dealNote: "" });
  const [addingItem, setAddingItem] = useState(false);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 800;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        setImagePreview(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }

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
          imageUrl: imagePreview ?? null,
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
        setItems((prev) => [...prev, newItem]);
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
    <div className="min-h-dvh bg-[#faf9f7]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#ece8e3] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-3.5">
          <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ece8e3] bg-white text-[#6b6560] hover:text-[#1a1714] transition">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-sm font-semibold text-[#1a1714] leading-tight">
              {step === "form" ? "List your place" : step === "add-items" ? "Add your menu" : "You're live!"}
            </p>
            <p className="text-xs text-[#a09c98]">Free · no account needed</p>
          </div>
          {/* Step indicator */}
          <div className="ml-auto flex items-center gap-1.5">
            {(["form", "add-items", "done"] as Step[]).map((s, i) => (
              <div key={s} className={`h-1.5 w-6 rounded-full transition-colors ${step === s ? "bg-[#e8472a]" : (["form", "add-items", "done"].indexOf(step) > i ? "bg-[#e8472a]/40" : "bg-[#ece8e3]")}`} />
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6">

        {/* ── Step 1: venue details ── */}
        {step === "form" && (
          <form onSubmit={submitVenue} className="space-y-4">
            <div className="card p-5">
              <h2 className="mb-0.5 text-base font-semibold text-[#1a1714]">About your place</h2>
              <p className="mb-4 text-sm text-[#a09c98]">Takes about 2 minutes. You can edit anytime.</p>
              <div className="space-y-3">
                <label className="block">
                  <span className="label">Business name *</span>
                  <input name="name" required placeholder="e.g. Corner Dairy Café" className="control mt-1.5" />
                </label>
                <label className="block">
                  <span className="label">Type *</span>
                  <select name="category" required className="control mt-1.5">
                    {FOOD_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="label">Short description</span>
                  <input name="description" placeholder="e.g. Cheap lunch specials daily, best bánh mì in town" className="control mt-1.5" />
                </label>

                {/* Image upload */}
                <div>
                  <span className="label">Photo</span>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  {imagePreview ? (
                    <div className="relative mt-1.5 overflow-hidden rounded-xl border border-[#ece8e3]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="Preview" className="h-44 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                        aria-label="Remove photo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-1.5 flex h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#ece8e3] bg-[#faf9f7] text-[#a09c98] transition hover:border-[#e8472a]/50 hover:text-[#e8472a]"
                    >
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-xs font-medium">Add a photo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="mb-4 text-base font-semibold text-[#1a1714]">Location</h2>
              <div className="space-y-3">
                <label className="block">
                  <span className="label">Street address</span>
                  <input name="address" placeholder="123 Main Street" className="control mt-1.5" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="label">Suburb</span>
                    <input name="suburb" placeholder="Grey Lynn" className="control mt-1.5" />
                  </label>
                  <label className="block">
                    <span className="label">City *</span>
                    <input name="city" required placeholder="Auckland" className="control mt-1.5" />
                  </label>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="mb-4 text-base font-semibold text-[#1a1714]">Contact <span className="text-[#a09c98] font-normal text-sm">(optional)</span></h2>
              <div className="space-y-3">
                <label className="block">
                  <span className="label">Phone</span>
                  <input name="phone" type="tel" placeholder="09 123 4567" className="control mt-1.5" />
                </label>
                <label className="block">
                  <span className="label">Website</span>
                  <input name="website" type="text" placeholder="https://yourcafe.co.nz" className="control mt-1.5" />
                </label>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? "Saving…" : "Continue — add your menu →"}
            </button>

            <p className="text-center text-xs text-[#a09c98]">
              Free advertising — your listing appears in near-me search instantly. No fees, ever.
            </p>
          </form>
        )}

        {/* ── Step 2: add items ── */}
        {step === "add-items" && venue && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#c6e8d0] bg-[#f0faf4] px-4 py-3.5">
              <p className="text-sm font-semibold text-[#1a6b3c]">Your place is live 🎉</p>
              <p className="mt-0.5 text-sm text-[#1a6b3c]/70">Now add menu items so people know your prices.</p>
            </div>

            {/* Claim token */}
            <div className="card p-4">
              <p className="label mb-2">Your edit token — save this</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-hidden rounded-lg bg-[#faf9f7] px-3 py-2.5 text-xs font-mono text-[#6b6560] break-all">{venue.claim_token}</code>
                <button
                  onClick={copyToken}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[#ece8e3] bg-white text-[#6b6560] transition hover:text-[#e8472a]"
                >
                  {copied ? <CheckCircle className="h-4 w-4 text-[#1a6b3c]" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-2 text-xs text-[#a09c98]">You need this to add or remove items later.</p>
            </div>

            {/* Items added so far */}
            {items.length > 0 && (
              <div className="card p-4">
                <p className="label mb-3">Added so far</p>
                <div className="divide-y divide-[#ece8e3]">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                      <span className="text-sm font-medium text-[#1a1714]">
                        {item.name}{item.isDeal && <span className="ml-1.5 text-[#e8472a]">🔥</span>}
                      </span>
                      <span className="text-sm font-semibold text-[#1a6b3c]">${Number(item.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New item form */}
            <div className="card p-4">
              <h3 className="mb-3 text-sm font-semibold text-[#1a1714]">Add an item</h3>
              <div className="space-y-2.5">
                <input
                  value={newItem.name}
                  onChange={(e) => setNewItem((v) => ({ ...v, name: e.target.value }))}
                  placeholder="Item name (e.g. Butter chicken, Flat white)"
                  className="control"
                />
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    value={newItem.price}
                    onChange={(e) => setNewItem((v) => ({ ...v, price: e.target.value }))}
                    type="number" min="0" step="0.5" placeholder="Price $"
                    className="control"
                  />
                  <input
                    value={newItem.category}
                    onChange={(e) => setNewItem((v) => ({ ...v, category: e.target.value }))}
                    placeholder="Category (optional)"
                    className="control"
                  />
                </div>
                <label className="flex items-center gap-2.5 text-sm font-medium text-[#1a1714]">
                  <input
                    type="checkbox"
                    checked={newItem.isDeal}
                    onChange={(e) => setNewItem((v) => ({ ...v, isDeal: e.target.checked }))}
                    className="h-4 w-4 rounded accent-[#e8472a]"
                  />
                  This is a deal or special
                </label>
                {newItem.isDeal && (
                  <input
                    value={newItem.dealNote}
                    onChange={(e) => setNewItem((v) => ({ ...v, dealNote: e.target.value }))}
                    placeholder="Deal note (e.g. Lunch special 11am–2pm)"
                    className="control"
                  />
                )}
                <button
                  onClick={addItem}
                  disabled={addingItem || !newItem.name.trim() || !newItem.price}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {addingItem ? "Saving…" : "+ Add item"}
                </button>
              </div>
            </div>

            <button
              onClick={() => setStep("done")}
              className="btn-ghost w-full"
            >
              {items.length === 0 ? "Skip — I'll add items later" : "Done →"}
            </button>
          </div>
        )}

        {/* ── Step 3: done ── */}
        {step === "done" && (
          <div className="py-12 text-center">
            <p className="text-5xl mb-5">🎉</p>
            <h2 className="text-2xl font-bold text-[#1a1714]">You&apos;re on the map!</h2>
            <p className="mt-2 text-sm text-[#6b6560] max-w-xs mx-auto">
              People nearby can now find your place and see your menu. Thanks for being part of mealspy.
            </p>
            <Link href="/" className="btn-primary mt-7 mx-auto">
              Browse mealspy
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
