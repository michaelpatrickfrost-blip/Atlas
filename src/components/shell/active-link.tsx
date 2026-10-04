"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function ActiveLink({ href, children, className = "", match, peers }: { href: string; children: React.ReactNode; className?: string; match?: string; peers?: string[] }) {
 const pathname = usePathname();
 const prefix = match ?? href;
 const matches = (candidate: string) => pathname === candidate || pathname.startsWith(candidate + "/");
 const best = (peers ?? [prefix]).filter(matches).sort((a, b) => b.length - a.length)[0];
 const active = best === prefix;
 return <Link href={href} aria-current={active ? "page" : undefined} className={`${className} ${active ? "atlas-active" : ""}`}>{children}</Link>;
}
