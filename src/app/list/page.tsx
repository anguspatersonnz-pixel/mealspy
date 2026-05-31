"use client";

import { ArrowLeft, CheckCircle, Copy, ImagePlus, Upload, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { FOOD_CATEGORIES } from "@/lib/data";
import type { OpeningHours } from "@/lib/data";

type Step = "form" | "add-items" | "done";
type CreatedVenue = { id: string; slug: string; claim_token: string };

const DAYS = [
  { key: "mon", label: "Mon" }, { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" }, { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" }, { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
] as const;

type DayKey = typeof DAYS[number]["key"];
type DayHours = { open: string; close: string } | null;

const DEFAULT_HOURS: Record<DayKey, DayHours> = {
  mon: { open: "08:00", close: "17:00" }, tue: { open: "08:00", close: "17:00" },
  wed: { open: "08:00", close: "17:00" }, thu: { open: "08:00", close: "17:00" },
  fri: { open: "08:00", close: "17:00" }, sat: null, sun: null,
};

export default function ListYourPlace() {
  const [step, setStep] = useState<Step>("form");
  const [venue, setVenue] = useState<CreatedVenue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [hours, setHours] = useState<Record<DayKey, DayHours>>(DEFAULT_HOURS);

  function setDay(day: DayKey, enabled: boolean) {
    setHours((h) => ({ ...h, [day]: enabled ? { open: "08:00", close: "17:00" } : null }));
  }
  function setDayTime(day: DayKey, field: "open" | "close", val: string) {
    setHours((h) => ({ ...h, [day]: { ...(h[day] ?? { open: "08:00", close: "17:00" }), [field]: val } }));
  }
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Menu upload
  const [menuFile, setMenuFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const menuInputRef = useRef<HTMLInputElement>(null);

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
          openingHours: hours as OpeningHours,
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

  async function uploadMenu() {
    if (!venue || !menuFile) return;
    setUploadStatus("uploading");
    try {
      const fd = new FormData();
      fd.append("token", venue.claim_token);
      fd.append("menu", menuFile);
      const res = await fetch(`/api/food/venues/${venue.id}/menu-upload`, { method: "POST", body: fd });
      setUploadStatus(res.ok ? "done" : "error");
    } catch {
      setUploadStatus("error");
    }
  }

  function copyToken() {
    if (!venue) return;
    navigator.clipboard.writeText(`${window.location.origin}/food/venues/${venue.slug}/edit?token=${venue.claim_token}`);
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
                  <input name="phone" type="text" placeholder="09 123 4567" className="control mt-1.5" />
                </label>
                <label className="block">
                  <span className="label">Website</span>
                  <input name="website" type="text" placeholder="https://yourcafe.co.nz" className="control mt-1.5" />
                </label>
              </div>
            </div>

            {/* Opening hours */}
            <div className="card p-5">
              <h2 className="mb-1 text-base font-semibold text-[#1a1714]">Opening hours <span className="text-[#a09c98] font-normal text-sm">(optional)</span></h2>
              <p className="mb-4 text-xs text-[#a09c98]">Helps customers know if you&apos;re open right now.</p>
              <div className="space-y-2">
                {DAYS.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <label className="flex w-10 items-center gap-1.5 text-sm font-medium text-[#1a1714]">
                      <input
                        type="checkbox"
                        checked={hours[key] !== null}
                        onChange={(e) => setDay(key, e.target.checked)}
                        className="h-4 w-4 accent-[#e8472a]"
                      />
                      {label}
                    </label>
                    {hours[key] ? (
                      <div className="flex items-center gap-1.5">
                        <input type="time" value={hours[key]!.open} onChange={(e) => setDayTime(key, "open", e.target.value)} className="control py-1 text-xs w-28" />
                        <span className="text-xs text-[#a09c98]">–</span>
                        <input type="time" value={hours[key]!.close} onChange={(e) => setDayTime(key, "close", e.target.value)} className="control py-1 text-xs w-28" />
                      </div>
                    ) : (
                      <span className="text-xs text-[#a09c98]">Closed</span>
                    )}
                  </div>
                ))}
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

        {/* ── Step 2: menu upload ── */}
        {step === "add-items" && venue && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#c6e8d0] bg-[#f0faf4] px-4 py-3.5">
              <p className="text-sm font-semibold text-[#1a6b3c]">Your place is live 🎉</p>
              <p className="mt-0.5 text-sm text-[#1a6b3c]/70">Upload your menu and we&apos;ll add it for you.</p>
            </div>

            {/* Management link */}
            <div className="card p-4 border-[#fad5ce] bg-[#fff8f6]">
              <p className="text-sm font-semibold text-[#c73d22] mb-1">⚠️ Save your management link</p>
              <p className="text-xs text-[#6b6560] mb-3">This is the only way to edit your menu and prices. Bookmark it or copy it somewhere safe.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-hidden rounded-lg bg-white border border-[#fad5ce] px-3 py-2 text-[11px] font-mono text-[#6b6560] break-all">
                  {typeof window !== "undefined" ? `${window.location.origin}/food/venues/${venue.slug}/edit?token=${venue.claim_token}` : `/food/venues/${venue.slug}/edit?token=${venue.claim_token}`}
                </code>
                <button
                  onClick={copyToken}
                  className="flex-shrink-0 rounded-lg border border-[#fad5ce] bg-white px-3 py-2 text-xs font-semibold text-[#e8472a]"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Menu upload */}
            <div className="card p-4">
              <h3 className="mb-1 text-sm font-semibold text-[#1a1714]">Upload your menu</h3>
              <p className="mb-3 text-xs text-[#a09c98]">PDF, photo, or screenshot — we&apos;ll handle the rest. Max 20 MB.</p>
              <input
                ref={menuInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => { setMenuFile(e.target.files?.[0] ?? null); setUploadStatus("idle"); }}
              />
              {menuFile ? (
                <div className="flex items-center gap-3 rounded-xl border border-[#ece8e3] bg-[#faf9f7] px-3.5 py-3">
                  <span className="text-lg">{menuFile.type.startsWith("image/") ? "🖼️" : "📄"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a1714] truncate">{menuFile.name}</p>
                    <p className="text-xs text-[#a09c98]">{(menuFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button onClick={() => { setMenuFile(null); setUploadStatus("idle"); if (menuInputRef.current) menuInputRef.current.value = ""; }} className="text-[#a09c98] hover:text-[#e8472a] transition">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => menuInputRef.current?.click()}
                  className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#ece8e3] bg-[#faf9f7] text-[#a09c98] transition hover:border-[#e8472a]/50 hover:text-[#e8472a]"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-xs font-medium">Choose file</span>
                </button>
              )}

              {menuFile && uploadStatus !== "done" && (
                <button
                  onClick={uploadMenu}
                  disabled={uploadStatus === "uploading"}
                  className="btn-primary w-full mt-3 disabled:opacity-50"
                >
                  {uploadStatus === "uploading" ? "Uploading…" : "Send menu"}
                </button>
              )}
              {uploadStatus === "done" && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#f0faf4] border border-[#c6e8d0] px-4 py-2.5">
                  <CheckCircle className="h-4 w-4 text-[#1a6b3c]" />
                  <p className="text-sm font-semibold text-[#1a6b3c]">Menu received — we&apos;ll add it shortly.</p>
                </div>
              )}
              {uploadStatus === "error" && (
                <p className="mt-2 text-xs text-red-600">Upload failed — please try again.</p>
              )}
            </div>

            <button onClick={() => setStep("done")} className="btn-ghost w-full">
              {uploadStatus === "done" ? "Continue →" : "Skip — I'll do this later"}
            </button>
          </div>
        )}

        {/* ── Step 3: done ── */}
        {step === "done" && venue && (
          <div className="space-y-4">
            <div className="py-8 text-center">
              <p className="text-5xl mb-4">🎉</p>
              <h2 className="text-2xl font-bold text-[#1a1714]">You&apos;re on the map!</h2>
              <p className="mt-2 text-sm text-[#6b6560] max-w-xs mx-auto">
                People nearby can now find your place.
              </p>
            </div>

            {/* Save your management link */}
            <div className="card p-4 border-[#fad5ce] bg-[#fff8f6]">
              <p className="text-sm font-semibold text-[#c73d22] mb-1">⚠️ Save your management link</p>
              <p className="text-xs text-[#6b6560] mb-3">This is the only way to edit your menu and prices later. Bookmark it or copy it somewhere safe.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-hidden rounded-lg bg-white border border-[#fad5ce] px-3 py-2 text-[11px] font-mono text-[#6b6560] break-all">
                  {typeof window !== "undefined" ? `${window.location.origin}/food/venues/${venue.slug}/edit?token=${venue.claim_token}` : `/food/venues/${venue.slug}/edit?token=${venue.claim_token}`}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/food/venues/${venue.slug}/edit?token=${venue.claim_token}`)}
                  className="flex-shrink-0 rounded-lg border border-[#fad5ce] bg-white px-3 py-2 text-xs font-semibold text-[#e8472a]"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Link
                href={`/food/venues/${venue.slug}/edit?token=${venue.claim_token}`}
                className="btn-primary flex items-center justify-center gap-2"
              >
                ✏️ Edit products, prices &amp; specials
              </Link>
              <Link href="/" className="btn-ghost flex items-center justify-center">
                Browse mealspy
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
