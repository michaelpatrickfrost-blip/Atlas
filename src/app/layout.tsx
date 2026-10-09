import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const atlasSans = localFont({
  src: [
    { path: "./fonts/Nunito-Variable.ttf", weight: "200 1000", style: "normal" },
    { path: "./fonts/Nunito-Italic-Variable.ttf", weight: "200 1000", style: "italic" },
  ],
  variable: "--font-atlas-sans",
  display: "swap",
});
const geistMono = localFont({ src: "./fonts/GeistMono-Variable.ttf", variable: "--font-geist-mono", weight: "100 900", display: "swap" });

export const metadata: Metadata = {
  title: "Atlas",
  description: "The business operating system for growing companies.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${atlasSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
