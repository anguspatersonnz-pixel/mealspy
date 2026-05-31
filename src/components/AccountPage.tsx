"use client";

import { ArrowLeft, Bell, CheckCircle2, Heart, LogOut, Save, User, Utensils } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { FOOD_CATEGORIES } from "@/lib/data";

type AccountProfile = {
  name: string;
  email: string;
  homeCity: string;
  favouriteFood: string;
  dietaryNeeds: string;
  maxLunchPrice: string;
  dealAlerts: boolean;
};

const emptyProfile: AccountProfile = {
  name: "",
  email: "",
  homeCity: "Auckland",
  favouriteFood: "",
  dietaryNeeds: "",
  maxLunchPrice: "15",
  dealAlerts: true,
};

const storageKey = "mealspy.accountProfile";

export default function AccountPage() {
  const [profile, setProfile] = useState<AccountProfile>(emptyProfile);
  const [savedProfile, setSavedProfile] = useState<AccountProfile | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as AccountProfile;
      setProfile({ ...emptyProfile, ...parsed });
      setSavedProfile({ ...emptyProfile, ...parsed });
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  const isCreated = Boolean(savedProfile?.name && savedProfile?.email);

  const personalisedIntro = useMemo(() => {
    if (!savedProfile) return "Create your account to save the way mealspy feels for you.";
    const food = savedProfile.favouriteFood.trim() || "good food";
    return `${savedProfile.name.split(" ")[0] || savedProfile.name}, your page is tuned for ${food} around ${savedProfile.homeCity}.`;
  }, [savedProfile]);

  function updateProfile<K extends keyof AccountProfile>(key: K, value: AccountProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = {
      ...profile,
      name: profile.name.trim(),
      email: profile.email.trim(),
      favouriteFood: profile.favouriteFood.trim(),
      dietaryNeeds: profile.dietaryNeeds.trim(),
    };

    window.localStorage.setItem(storageKey, JSON.stringify(next));
    setProfile(next);
    setSavedProfile(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2400);
  }

  function resetProfile() {
    window.localStorage.removeItem(storageKey);
    setProfile(emptyProfile);
    setSavedProfile(null);
    setSaved(false);
  }

  return (
    <div className="min-h-dvh bg-[#faf9f7]">
      <header className="sticky top-0 z-40 border-b border-[#ece8e3] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3.5">
          <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ece8e3] bg-white text-[#6b6560] transition hover:text-[#1a1714]">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-sm font-semibold leading-tight text-[#1a1714]">Account</p>
            <p className="text-xs text-[#a09c98]">{isCreated ? "Your personalised mealspy" : "Create your mealspy profile"}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-2xl gap-4 px-4 py-5">
        <section className="rounded-2xl border border-[#ece8e3] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#fff4f2] text-[#e8472a]">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1a1714]">
                {isCreated ? `Hi, ${savedProfile?.name}` : "Make your account"}
              </h1>
              <p className="mt-1 text-sm leading-6 text-[#6b6560]">{personalisedIntro}</p>
            </div>
          </div>
        </section>

        <form onSubmit={saveProfile} className="grid gap-4">
          <section className="card p-5">
            <h2 className="text-base font-semibold text-[#1a1714]">Profile details</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="label">Name</span>
                <input
                  required
                  value={profile.name}
                  onChange={(event) => updateProfile("name", event.target.value)}
                  placeholder="Your name"
                  className="control mt-1.5"
                />
              </label>
              <label className="block">
                <span className="label">Email</span>
                <input
                  required
                  type="email"
                  value={profile.email}
                  onChange={(event) => updateProfile("email", event.target.value)}
                  placeholder="you@example.com"
                  className="control mt-1.5"
                />
              </label>
            </div>
          </section>

          <section className="card p-5">
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-[#e8472a]" />
              <h2 className="text-base font-semibold text-[#1a1714]">Personalise your page</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="label">Home city</span>
                <select
                  value={profile.homeCity}
                  onChange={(event) => updateProfile("homeCity", event.target.value)}
                  className="control mt-1.5"
                >
                  {["Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga", "Dunedin"].map((city) => (
                    <option key={city}>{city}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label">Favourite type</span>
                <select
                  value={profile.favouriteFood}
                  onChange={(event) => updateProfile("favouriteFood", event.target.value)}
                  className="control mt-1.5"
                >
                  <option value="">Surprise me</option>
                  {FOOD_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.label}>{category.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label">Dietary notes</span>
                <input
                  value={profile.dietaryNeeds}
                  onChange={(event) => updateProfile("dietaryNeeds", event.target.value)}
                  placeholder="Vegetarian, gluten-free..."
                  className="control mt-1.5"
                />
              </label>
              <label className="block">
                <span className="label">Lunch budget</span>
                <select
                  value={profile.maxLunchPrice}
                  onChange={(event) => updateProfile("maxLunchPrice", event.target.value)}
                  className="control mt-1.5"
                >
                  <option value="10">Up to $10</option>
                  <option value="15">Up to $15</option>
                  <option value="20">Up to $20</option>
                  <option value="25">Up to $25</option>
                </select>
              </label>
            </div>

            <label className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-[#ece8e3] bg-[#faf9f7] px-4 py-3">
              <span className="flex min-w-0 items-center gap-3">
                <Bell className="h-4 w-4 flex-shrink-0 text-[#e8472a]" />
                <span>
                  <span className="block text-sm font-semibold text-[#1a1714]">Deal alerts</span>
                  <span className="block text-xs text-[#6b6560]">Show deals that match your saved tastes.</span>
                </span>
              </span>
              <input
                type="checkbox"
                checked={profile.dealAlerts}
                onChange={(event) => updateProfile("dealAlerts", event.target.checked)}
                className="h-5 w-5 rounded border-[#d4cfc9] accent-[#e8472a]"
              />
            </label>
          </section>

          <section className="card p-5">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-[#e8472a]" />
              <h2 className="text-base font-semibold text-[#1a1714]">Your page preview</h2>
            </div>
            <div className="mt-4 rounded-xl border border-[#fad5ce] bg-[#fff8f6] px-4 py-3">
              <p className="text-sm font-semibold text-[#1a1714]">
                {profile.name.trim() ? `${profile.name.trim()}'s mealspy` : "Your mealspy"}
              </p>
              <p className="mt-1 text-sm text-[#6b6560]">
                {profile.favouriteFood || "Food"} deals in {profile.homeCity}, around ${profile.maxLunchPrice}
                {profile.dietaryNeeds ? `, with ${profile.dietaryNeeds.toLowerCase()} in mind` : ""}.
              </p>
            </div>
          </section>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="submit" className="btn-primary flex-1">
              {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? "Saved" : isCreated ? "Save changes" : "Create account"}
            </button>
            {isCreated && (
              <button type="button" onClick={resetProfile} className="btn-ghost flex-1 text-[#6b6560]">
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
