import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({ src: "./fonts/PlusJakartaSans-Variable.ttf", variable: "--font-geist-sans", weight: "200 800", display: "swap" });
const geistMono = localFont({ src: "./fonts/GeistMono-Variable.ttf", variable: "--font-geist-mono", weight: "100 900", display: "swap" });

export const metadata: Metadata = {
  title: "Atlas",
  description: "The business operating system for growing companies.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
