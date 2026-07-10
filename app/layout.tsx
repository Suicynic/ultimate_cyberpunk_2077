import type { Metadata, Viewport } from "next";
import { Chakra_Petch, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/shared/AppShell";

const chakra = Chakra_Petch({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-chakra",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: {
    default: "Ultimate Cyberpunk 2077 — Companion",
    template: "%s · UC77 Companion",
  },
  description:
    "Unofficial local-first companion for planning, tracking, and documenting Cyberpunk 2077 and Phantom Liberty playthroughs. Not affiliated with CD Projekt Red.",
  applicationName: "Ultimate Cyberpunk 2077 Companion",
};

export const viewport: Viewport = {
  themeColor: "#07090d",
  width: "device-width",
  initialScale: 1,
  // Opt into the full display on notched / Dynamic-Island iPhones. Without
  // viewport-fit=cover, iOS Safari keeps every env(safe-area-inset-*) at 0, so
  // the safe-area padding utilities in globals.css would be no-ops. See issue #2.
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${chakra.variable} ${jetbrains.variable}`}>
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
