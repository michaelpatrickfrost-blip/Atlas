import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./premium.css";
import "./macro.css";

const atlasSans = localFont({ src: "./fonts/Inter-Variable.ttf", variable: "--font-atlas-sans", weight: "100 900", display: "swap" });
const atlasSerif = localFont({ src: "./fonts/Newsreader-Variable.ttf", variable: "--font-atlas-serif", weight: "200 800", display: "swap" });
const geistMono = localFont({ src: "./fonts/GeistMono-Variable.ttf", variable: "--font-geist-mono", weight: "100 900", display: "swap" });

export const metadata: Metadata = {
  title: "Atlas",
  description: "The business operating system for growing companies.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${atlasSans.variable} ${atlasSerif.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
