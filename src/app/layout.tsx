import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "yourbeer | Cheapest alcohol near you",
  description:
    "Find nearby alcohol prices, tonight's bar specials, and direct listings from licensed breweries and makers.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "yourbeer",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#245c3b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NZ">
      <body>{children}</body>
    </html>
  );
}
