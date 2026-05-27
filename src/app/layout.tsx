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
      <body>
        {children}
        <footer style={{ marginTop: "4rem", borderTop: "1px solid #e5e7eb", background: "#fff", padding: "2.5rem 1rem" }}>
          <div style={{ maxWidth: "64rem", margin: "0 auto", display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center", textAlign: "center" }}>
            <p style={{ fontWeight: 700, color: "#245c3b", fontSize: "1rem" }}>yourbeer</p>
            <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
              Find cheap beer near you — prices from bottle shops, bars, and breweries across NZ.
            </p>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.5rem" }}>
              Contact:{" "}
              <a href="mailto:cheapernz@gmail.com" style={{ color: "#245c3b", textDecoration: "none" }}>
                cheapernz@gmail.com
              </a>
            </p>
            <p style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.5rem" }}>
              Prices crowd-sourced by the community. Always verify before you go.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
