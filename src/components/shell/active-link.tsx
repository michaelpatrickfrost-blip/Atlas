"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function ActiveLink({ href, children, className = "", match }: { href: string; children: React.ReactNode; className?: string; match?: string }) {
 const pathname = usePathname();
 const prefix = match ?? href;
 const active = pathname === prefix || pathname.startsWith(prefix + "/");
 return <Link href={href} aria-current={active ? "page" : undefined} className={`${className} ${active ? "atlas-active" : ""}`}>{children}</Link>;
}
