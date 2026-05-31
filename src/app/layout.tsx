import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "mealspy — cheap food near you",
  description: "Find great value food near you. Restaurants, cafés, and takeaways list their prices and deals directly — no ads, no fluff.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "mealspy", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#e8472a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NZ" className={jakarta.variable}>
      <body style={{ fontFamily: "var(--font-jakarta), ui-sans-serif, system-ui, sans-serif" }}>
        <div className="w-full bg-[#e8472a] py-2 text-center text-sm font-semibold text-white">
          just two kiwi mates helping you save great
        </div>
        {children}

        <footer className="mt-16 border-t border-[#ece8e3] bg-white py-10">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <p className="text-sm font-semibold text-[#1a1714]">mealspy</p>
            <p className="mt-1 text-sm text-[#6b6560]">
              Real prices from local food places across New Zealand.
            </p>
            <p className="mt-3 text-sm text-[#6b6560]">
              Contact{" "}
              <a href="mailto:cheapernz@gmail.com" className="font-semibold text-[#e8472a] hover:underline">
                cheapernz@gmail.com
              </a>
            </p>
            <p className="mt-2 text-xs text-[#a09c98]">
              Prices submitted by venues. Always check before you go.
            </p>
            <p className="mt-1 text-xs text-[#a09c98]">
              Inspired by but not affiliated with Gaspy.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
