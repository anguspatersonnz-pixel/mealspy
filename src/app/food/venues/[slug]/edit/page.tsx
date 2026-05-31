"use client";

import { ArrowLeft, Camera, Check, ClipboardList, Pencil, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FoodItem, FoodVenue } from "@/lib/data";
import { money } from "@/lib/data";

type EditingItem = { name: string; price: string; description: string; isDeal: boolean; dealNote: string };
type PreviewItem = { name: string; price: number; category: string | null; description: string | null; isDeal: boolean; dealNote: string | null; selected: boolean };
type Mode = "list" | "paste" | "photo";

const EMPTY_EDIT: EditingItem = { name: "", price: "", description: "", isDeal: false, dealNote: "" };

export default function EditVenuePage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [venue, setVenue] = useState<FoodVenue | null>(null);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [mode, setMode] = useState<Mode>("list");

  // Single item add/edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditingItem>(EMPTY_EDIT);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState<EditingItem>(EMPTY_EDIT);
  const [addingItem, setAddingItem] = useState(false);

  // Paste mode
  const [pasteText, setPasteText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [preview, setPreview] = useState<PreviewItem[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkDone, setBulkDone] = useState(false);

  // Photo mode
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) { setAuthError(true); setLoading(false); return; }
    fetch(`/api/food/venues/${slug}/items`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setAuthError(true); return; }
        setItems(d.items ?? []);
        return fetch(`/api/food/venues?slug=${slug}`).then((r) => r.json()).then((v) => {
          if (v.venues?.[0]) setVenue(v.venues[0]);
        });
      })
      .catch(() => setAuthError(true))
      .finally(() => setLoading(false));
  }, [slug, token]);

  // ── Single item helpers ───────────────────────────────────────────────────
  function startEdit(item: FoodItem) {
    setEditingId(item.id);
    setEditDraft({ name: item.name, price: String(item.price), description: item.description ?? "", isDeal: item.isDeal, dealNote: item.dealNote ?? "" });
  }

  async function saveEdit(itemId: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/food/venues/${slug}/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: itemId, name: editDraft.name.trim(), price: Number(editDraft.price), description: editDraft.description.trim() || null, isDeal: editDraft.isDeal, dealNote: editDraft.dealNote.trim() || null }),
      });
      if (res.ok) { const d = await res.json(); setItems((p) => p.map((i) => i.id === itemId ? d.item : i)); setEditingId(null); }
    } finally { setSaving(false); }
  }

  async function deleteItem(itemId: string) {
    if (!confirm("Delete this item?")) return;
    const res = await fetch(`/api/food/venues/${slug}/items?item_id=${itemId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setItems((p) => p.filter((i) => i.id !== itemId));
  }

  async function addNewItem() {
    if (!newItem.name.trim() || !newItem.price) return;
    setAddingItem(true);
    try {
      const res = await fetch(`/api/food/venues/${slug}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newItem.name.trim(), price: Number(newItem.price), description: newItem.description.trim() || null, isDeal: newItem.isDeal, dealNote: newItem.dealNote.trim() || null }),
      });
      if (res.ok) { const d = await res.json(); setItems((p) => [...p, d.item]); setNewItem(EMPTY_EDIT); setShowAdd(false); }
    } finally { setAddingItem(false); }
  }

  // ── Paste extraction ──────────────────────────────────────────────────────
  async function extractFromText() {
    if (!pasteText.trim()) return;
    setExtracting(true);
    setExtractError("");
    setPreview([]);
    try {
      const res = await fetch(`/api/food/venues/${slug}/extract-menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: pasteText }),
      });
      const d = await res.json();
      if (!res.ok) { setExtractError(d.error ?? "Failed to extract"); return; }
      if (!d.items?.length) { setExtractError("No items found — check your formatting and try again."); return; }
      setPreview(d.items.map((i: Omit<PreviewItem, "selected">) => ({ ...i, selected: true })));
    } catch { setExtractError("Something went wrong."); }
    finally { setExtracting(false); }
  }

  // ── Photo extraction ──────────────────────────────────────────────────────
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPreview([]);
    setExtractError("");
    if (file) setPhotoPreview(URL.createObjectURL(file));
    else setPhotoPreview(null);
  }

  async function extractFromPhoto() {
    if (!photoFile) return;
    setExtracting(true);
    setExtractError("");
    setPreview([]);
    try {
      const form = new FormData();
      form.append("image", photoFile);
      const res = await fetch(`/api/food/venues/${slug}/extract-menu`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const d = await res.json();
      if (!res.ok) { setExtractError(d.error ?? "Failed to extract"); return; }
      if (!d.items?.length) { setExtractError("No items found in photo. Try copy-pasting the text instead."); return; }
      setPreview(d.items.map((i: Omit<PreviewItem, "selected">) => ({ ...i, selected: true })));
    } catch { setExtractError("Something went wrong."); }
    finally { setExtracting(false); }
  }

  // ── Bulk save ─────────────────────────────────────────────────────────────
  async function saveBulk() {
    const toSave = preview.filter((i) => i.selected);
    if (!toSave.length) return;
    setBulkSaving(true);
    try {
      for (const item of toSave) {
        const res = await fetch(`/api/food/venues/${slug}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: item.name, price: item.price, description: item.description, isDeal: item.isDeal, dealNote: item.dealNote }),
        });
        if (res.ok) { const d = await res.json(); setItems((p) => [...p, d.item]); }
      }
      setBulkDone(true);
      setPasteText("");
      setPreview([]);
      setPhotoFile(null);
      setPhotoPreview(null);
      setTimeout(() => { setBulkDone(false); setMode("list"); }, 1500);
    } finally { setBulkSaving(false); }
  }

  if (loading) return <div className="flex min-h-dvh items-center justify-center"><p className="animate-pulse text-sm text-[#a09c98]">Loading…</p></div>;

  if (authError || !token) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-4xl">🔒</p>
        <h1 className="text-lg font-semibold text-[#1a1714]">Edit token required</h1>
        <p className="text-sm text-[#a09c98] max-w-xs">Use the link from your listing confirmation.</p>
        <Link href="/" className="btn-ghost">← Back to mealspy</Link>
      </div>
    );
  }

  const deals = items.filter((i) => i.isDeal);
  const regular = items.filter((i) => !i.isDeal);

  return (
    <div className="min-h-dvh bg-[#faf9f7]">
      <header className="sticky top-0 z-40 border-b border-[#ece8e3] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-3.5">
          <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ece8e3] bg-white text-[#6b6560]">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1a1714] leading-tight truncate">{venue?.name ?? "Edit your place"}</p>
            <p className="text-xs text-[#a09c98]">{items.length} item{items.length !== 1 ? "s" : ""} on menu</p>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="flex border-t border-[#ece8e3]">
          {([
            { key: "list", label: "Add item", icon: <Plus className="h-3.5 w-3.5" /> },
            { key: "paste", label: "Paste menu", icon: <ClipboardList className="h-3.5 w-3.5" /> },
            { key: "photo", label: "Photo", icon: <Camera className="h-3.5 w-3.5" /> },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => { setMode(t.key); setPreview([]); setExtractError(""); }}
              className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition border-b-2 ${mode === t.key ? "border-[#e8472a] text-[#e8472a]" : "border-transparent text-[#a09c98]"}`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-5 space-y-4">

        {/* ── Mode: Add one by one ── */}
        {mode === "list" && (
          <>
            <button
              onClick={() => setShowAdd((v) => !v)}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#e8472a] py-3 text-sm font-bold text-white"
            >
              <Plus className="h-4 w-4" /> Add item
            </button>

            {showAdd && (
              <div className="card p-4 space-y-2.5">
                <p className="text-sm font-semibold text-[#1a1714]">New item</p>
                <ItemFields draft={newItem} setDraft={setNewItem} />
                <div className="flex gap-2 pt-1">
                  <button onClick={addNewItem} disabled={addingItem || !newItem.name.trim() || !newItem.price} className="btn-primary flex-1 disabled:opacity-50">
                    {addingItem ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => { setShowAdd(false); setNewItem(EMPTY_EDIT); }} className="btn-ghost flex-1">Cancel</button>
                </div>
              </div>
            )}

            {items.length === 0 && !showAdd && (
              <div className="rounded-2xl border border-[#ece8e3] bg-white px-6 py-10 text-center">
                <p className="text-3xl mb-3">🍽️</p>
                <p className="text-sm font-semibold text-[#1a1714]">No items yet</p>
                <p className="mt-1 text-xs text-[#a09c98]">Add items above, paste your menu, or take a photo.</p>
              </div>
            )}

            {deals.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-[#ece8e3]"><p className="text-sm font-semibold text-[#1a1714]">🔥 Deals & specials</p></div>
                <div className="divide-y divide-[#ece8e3]">
                  {deals.map((item) => (
                    <ItemRow key={item.id} item={item} isEditing={editingId === item.id} draft={editDraft} setDraft={setEditDraft} onEdit={() => startEdit(item)} onSave={() => saveEdit(item.id)} onCancel={() => setEditingId(null)} onDelete={() => deleteItem(item.id)} saving={saving} />
                  ))}
                </div>
              </div>
            )}

            {regular.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-[#ece8e3]"><p className="text-sm font-semibold text-[#1a1714]">Menu items</p></div>
                <div className="divide-y divide-[#ece8e3]">
                  {regular.map((item) => (
                    <ItemRow key={item.id} item={item} isEditing={editingId === item.id} draft={editDraft} setDraft={setEditDraft} onEdit={() => startEdit(item)} onSave={() => saveEdit(item.id)} onCancel={() => setEditingId(null)} onDelete={() => deleteItem(item.id)} saving={saving} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Mode: Paste text ── */}
        {mode === "paste" && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-[#ece8e3] bg-white p-4 space-y-2">
              <p className="text-sm font-semibold text-[#1a1714]">Paste your menu</p>
              <p className="text-xs text-[#a09c98]">Copy from a PDF, Google Doc, or type it out. We&apos;ll extract the items automatically.</p>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={"Burgers\nClassic Burger ......... $14\nBacon Burger ........... $16\n\nDrinks\nCoke .................. $4"}
                rows={10}
                className="control w-full font-mono text-xs resize-none"
              />
              <button
                onClick={extractFromText}
                disabled={extracting || !pasteText.trim()}
                className="w-full rounded-2xl bg-[#e8472a] py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {extracting ? "Extracting…" : "Extract items"}
              </button>
            </div>
            {extractError && <p className="rounded-xl bg-[#fff4f2] px-4 py-3 text-sm font-medium text-[#e8472a]">{extractError}</p>}
            {preview.length > 0 && <PreviewList preview={preview} setPreview={setPreview} onSave={saveBulk} saving={bulkSaving} done={bulkDone} />}
          </div>
        )}

        {/* ── Mode: Photo ── */}
        {mode === "photo" && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-[#ece8e3] bg-white p-4 space-y-3">
              <p className="text-sm font-semibold text-[#1a1714]">Take a photo of your menu</p>
              <p className="text-xs text-[#a09c98]">AI will read the prices and items directly from the image. Works with chalkboards, printed menus, and handwritten lists.</p>

              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFileChange} className="hidden" />
              <button onClick={() => fileRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#ece8e3] py-8 text-sm font-semibold text-[#a09c98] hover:border-[#e8472a] hover:text-[#e8472a] transition">
                <Camera className="h-5 w-5" />
                {photoFile ? photoFile.name : "Tap to take photo or choose image"}
              </button>

              {photoPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="Menu preview" className="w-full rounded-xl object-contain max-h-64" />
              )}

              <button
                onClick={extractFromPhoto}
                disabled={extracting || !photoFile}
                className="w-full rounded-2xl bg-[#e8472a] py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {extracting ? "Reading menu…" : "Extract items from photo"}
              </button>
            </div>
            {extractError && <p className="rounded-xl bg-[#fff4f2] px-4 py-3 text-sm font-medium text-[#e8472a]">{extractError}</p>}
            {preview.length > 0 && <PreviewList preview={preview} setPreview={setPreview} onSave={saveBulk} saving={bulkSaving} done={bulkDone} />}
          </div>
        )}
      </main>
    </div>
  );
}

function PreviewList({ preview, setPreview, onSave, saving, done }: {
  preview: PreviewItem[];
  setPreview: React.Dispatch<React.SetStateAction<PreviewItem[]>>;
  onSave: () => void;
  saving: boolean;
  done: boolean;
}) {
  const selectedCount = preview.filter((i) => i.selected).length;

  function update(i: number, patch: Partial<PreviewItem>) {
    setPreview((p) => p.map((x, j) => j === i ? { ...x, ...patch } : x));
  }

  return (
    <div className="rounded-2xl border border-[#ece8e3] bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-[#ece8e3] flex items-center justify-between">
        <p className="text-sm font-semibold text-[#1a1714]">Found {preview.length} items — edit before saving</p>
        <p className="text-xs text-[#a09c98]">{selectedCount} selected</p>
      </div>
      <div className="divide-y divide-[#ece8e3]">
        {preview.map((item, i) => (
          <div key={i} className={`px-4 py-3 space-y-2 ${!item.selected ? "opacity-40" : ""}`}>
            {/* Select + name row */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.selected}
                onChange={(e) => update(i, { selected: e.target.checked })}
                className="h-4 w-4 rounded accent-[#e8472a] flex-shrink-0"
              />
              <input
                value={item.name}
                onChange={(e) => update(i, { name: e.target.value })}
                disabled={!item.selected}
                className="flex-1 rounded-lg border border-[#ece8e3] bg-[#faf9f7] px-2.5 py-1.5 text-sm font-medium text-[#1a1714] outline-none focus:border-[#e8472a] focus:bg-white disabled:cursor-default"
              />
              <input
                value={item.price}
                type="number"
                min="0"
                step="0.5"
                onChange={(e) => update(i, { price: Number(e.target.value) })}
                disabled={!item.selected}
                className="w-20 rounded-lg border border-[#ece8e3] bg-[#faf9f7] px-2.5 py-1.5 text-sm font-semibold text-[#1a6b3c] outline-none focus:border-[#e8472a] focus:bg-white disabled:cursor-default"
              />
            </div>
            {/* Description + deal */}
            {item.selected && (
              <div className="flex gap-2 pl-6">
                <input
                  value={item.description ?? ""}
                  onChange={(e) => update(i, { description: e.target.value || null })}
                  placeholder="Description (optional)"
                  className="flex-1 rounded-lg border border-[#ece8e3] bg-[#faf9f7] px-2.5 py-1 text-xs text-[#6b6560] outline-none focus:border-[#e8472a] focus:bg-white"
                />
                <label className="flex items-center gap-1 text-xs text-[#a09c98] whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={item.isDeal}
                    onChange={(e) => update(i, { isDeal: e.target.checked })}
                    className="accent-[#e8472a]"
                  />
                  Deal
                </label>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-[#ece8e3]">
        <button
          onClick={onSave}
          disabled={saving || selectedCount === 0 || done}
          className="w-full rounded-2xl bg-[#1a6b3c] py-3 text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {done ? <><Check className="h-4 w-4" /> Saved!</> : saving ? "Saving…" : `Add ${selectedCount} item${selectedCount !== 1 ? "s" : ""} to menu`}
        </button>
      </div>
    </div>
  );
}

function ItemFields({ draft, setDraft }: { draft: EditingItem; setDraft: (d: EditingItem) => void }) {
  return (
    <div className="space-y-2">
      <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Item name *" className="control" />
      <input value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} type="number" min="0" step="0.5" placeholder="Price $ *" className="control" />
      <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Description (optional)" className="control" />
      <label className="flex items-center gap-2 text-sm font-medium text-[#1a1714]">
        <input type="checkbox" checked={draft.isDeal} onChange={(e) => setDraft({ ...draft, isDeal: e.target.checked })} className="h-4 w-4 rounded accent-[#e8472a]" />
        Deal or special
      </label>
      {draft.isDeal && (
        <input value={draft.dealNote} onChange={(e) => setDraft({ ...draft, dealNote: e.target.value })} placeholder="Deal note (e.g. Lunch special 11am–2pm)" className="control" />
      )}
    </div>
  );
}

function ItemRow({ item, isEditing, draft, setDraft, onEdit, onSave, onCancel, onDelete, saving }: {
  item: FoodItem; isEditing: boolean; draft: EditingItem; setDraft: (d: EditingItem) => void;
  onEdit: () => void; onSave: () => void; onCancel: () => void; onDelete: () => void; saving: boolean;
}) {
  if (isEditing) {
    return (
      <div className="px-4 py-3 space-y-2.5">
        <ItemFields draft={draft} setDraft={setDraft} />
        <div className="flex gap-2 pt-1">
          <button onClick={onSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-1.5">
            <Check className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={onCancel} className="btn-ghost flex-1 flex items-center justify-center gap-1.5">
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1a1714]">{item.name}</p>
        {item.dealNote && <p className="text-xs font-medium text-[#e8472a] mt-0.5">{item.dealNote}</p>}
        {item.description && <p className="text-xs text-[#a09c98] mt-0.5">{item.description}</p>}
      </div>
      <p className="flex-shrink-0 text-sm font-semibold text-[#1a6b3c]">{money(item.price)}</p>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={onEdit} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#ece8e3] text-[#6b6560] hover:text-[#e8472a] transition">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={onDelete} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#ece8e3] text-[#6b6560] hover:text-red-500 transition">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
