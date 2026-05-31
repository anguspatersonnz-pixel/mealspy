"use client";

import { ArrowLeft, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { FoodItem, FoodVenue } from "@/lib/data";
import { money } from "@/lib/data";

type EditingItem = { name: string; price: string; category: string; description: string; isDeal: boolean; dealNote: string };

const EMPTY_EDIT: EditingItem = { name: "", price: "", category: "", description: "", isDeal: false, dealNote: "" };

export default function EditVenuePage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [venue, setVenue] = useState<FoodVenue | null>(null);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditingItem>(EMPTY_EDIT);
  const [saving, setSaving] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState<EditingItem>(EMPTY_EDIT);
  const [addingItem, setAddingItem] = useState(false);

  useEffect(() => {
    if (!token) { setAuthError(true); setLoading(false); return; }
    fetch(`/api/food/venues/${slug}/items`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setAuthError(true); return; }
        setItems(d.items ?? []);
        // fetch venue info
        return fetch(`/api/food/venues?slug=${slug}`).then((r) => r.json()).then((v) => {
          if (v.venues?.[0]) setVenue(v.venues[0]);
        });
      })
      .catch(() => setAuthError(true))
      .finally(() => setLoading(false));
  }, [slug, token]);

  function startEdit(item: FoodItem) {
    setEditingId(item.id);
    setEditDraft({
      name: item.name,
      price: String(item.price),
      category: item.category ?? "",
      description: item.description ?? "",
      isDeal: item.isDeal,
      dealNote: item.dealNote ?? "",
    });
  }

  async function saveEdit(itemId: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/food/venues/${slug}/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: itemId,
          name: editDraft.name.trim(),
          price: Number(editDraft.price),
          category: editDraft.category.trim() || null,
          description: editDraft.description.trim() || null,
          isDeal: editDraft.isDeal,
          dealNote: editDraft.dealNote.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => prev.map((i) => (i.id === itemId ? data.item : i)));
        setEditingId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(itemId: string) {
    if (!confirm("Delete this item?")) return;
    const res = await fetch(`/api/food/venues/${slug}/items?item_id=${itemId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  async function addNewItem() {
    if (!newItem.name.trim() || !newItem.price) return;
    setAddingItem(true);
    try {
      const res = await fetch(`/api/food/venues/${slug}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: newItem.name.trim(),
          price: Number(newItem.price),
          category: newItem.category.trim() || null,
          description: newItem.description.trim() || null,
          isDeal: newItem.isDeal,
          dealNote: newItem.dealNote.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => [...prev, data.item]);
        setNewItem(EMPTY_EDIT);
        setShowAdd(false);
      }
    } finally {
      setAddingItem(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="animate-pulse text-sm text-[#a09c98]">Loading…</p>
      </div>
    );
  }

  if (authError || !token) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-4xl">🔒</p>
        <h1 className="text-lg font-semibold text-[#1a1714]">Edit token required</h1>
        <p className="text-sm text-[#a09c98] max-w-xs">
          Use the link from your listing confirmation — it includes your edit token.
        </p>
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
          <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ece8e3] bg-white text-[#6b6560] hover:text-[#1a1714] transition">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-sm font-semibold text-[#1a1714] leading-tight">
              {venue?.name ?? "Edit your place"}
            </p>
            <p className="text-xs text-[#a09c98]">Products, prices & specials</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6 space-y-4">
        {/* Add item button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-[#e8472a] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#c73d22]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add item
          </button>
        </div>

        {/* Add item form */}
        {showAdd && (
          <div className="card p-4 space-y-2.5">
            <h3 className="text-sm font-semibold text-[#1a1714]">New item</h3>
            <ItemFields draft={newItem} setDraft={setNewItem} />
            <div className="flex gap-2 pt-1">
              <button
                onClick={addNewItem}
                disabled={addingItem || !newItem.name.trim() || !newItem.price}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {addingItem ? "Saving…" : "Save item"}
              </button>
              <button onClick={() => { setShowAdd(false); setNewItem(EMPTY_EDIT); }} className="btn-ghost flex-1">
                Cancel
              </button>
            </div>
          </div>
        )}

        {items.length === 0 && !showAdd && (
          <div className="rounded-2xl border border-[#ece8e3] bg-white px-6 py-10 text-center">
            <p className="text-3xl mb-3">🍽️</p>
            <p className="text-sm font-semibold text-[#1a1714]">No items yet</p>
            <p className="mt-1 text-xs text-[#a09c98]">Add your first menu item above.</p>
          </div>
        )}

        {/* Deals / Specials */}
        {deals.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-[#ece8e3]">
              <p className="text-sm font-semibold text-[#1a1714]">🔥 Deals & specials</p>
            </div>
            <div className="divide-y divide-[#ece8e3]">
              {deals.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  isEditing={editingId === item.id}
                  draft={editDraft}
                  setDraft={setEditDraft}
                  onEdit={() => startEdit(item)}
                  onSave={() => saveEdit(item.id)}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => deleteItem(item.id)}
                  saving={saving}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular items */}
        {regular.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-[#ece8e3]">
              <p className="text-sm font-semibold text-[#1a1714]">Menu items</p>
            </div>
            <div className="divide-y divide-[#ece8e3]">
              {regular.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  isEditing={editingId === item.id}
                  draft={editDraft}
                  setDraft={setEditDraft}
                  onEdit={() => startEdit(item)}
                  onSave={() => saveEdit(item.id)}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => deleteItem(item.id)}
                  saving={saving}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ItemFields({ draft, setDraft }: { draft: EditingItem; setDraft: (d: EditingItem) => void }) {
  return (
    <div className="space-y-2">
      <input
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        placeholder="Item name *"
        className="control"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={draft.price}
          onChange={(e) => setDraft({ ...draft, price: e.target.value })}
          type="number" min="0" step="0.5" placeholder="Price $ *"
          className="control"
        />
        <input
          value={draft.category}
          onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          placeholder="Category"
          className="control"
        />
      </div>
      <input
        value={draft.description}
        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        placeholder="Description (optional)"
        className="control"
      />
      <label className="flex items-center gap-2 text-sm font-medium text-[#1a1714]">
        <input
          type="checkbox"
          checked={draft.isDeal}
          onChange={(e) => setDraft({ ...draft, isDeal: e.target.checked })}
          className="h-4 w-4 rounded accent-[#e8472a]"
        />
        Deal or special
      </label>
      {draft.isDeal && (
        <input
          value={draft.dealNote}
          onChange={(e) => setDraft({ ...draft, dealNote: e.target.value })}
          placeholder="Deal note (e.g. Lunch special 11am–2pm)"
          className="control"
        />
      )}
    </div>
  );
}

function ItemRow({
  item, isEditing, draft, setDraft, onEdit, onSave, onCancel, onDelete, saving,
}: {
  item: FoodItem;
  isEditing: boolean;
  draft: EditingItem;
  setDraft: (d: EditingItem) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  saving: boolean;
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
        {item.category && <p className="text-xs text-[#a09c98]">{item.category}</p>}
      </div>
      <p className="flex-shrink-0 text-sm font-semibold text-[#1a6b3c]">{money(item.price)}</p>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={onEdit} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#ece8e3] text-[#6b6560] hover:text-[#e8472a] hover:border-[#e8472a] transition">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={onDelete} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#ece8e3] text-[#6b6560] hover:text-red-500 hover:border-red-300 transition">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
