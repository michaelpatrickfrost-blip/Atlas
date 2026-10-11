"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";
const guideIds = new Set([
  "customers",
  "sales",
  "crm",
  "manufacturing",
  "logistics",
  "stock",
  "products",
  "planning",
  "finance",
  "plan",
  "sop",
  "projects",
  "people",
  "scheduling",
  "payroll",
  "teams",
  "kpis",
  "marketing",
  "meetings",
  "maintenance",
  "quality",
  "engineering",
  "fleet",
  "fieldservice",
  "safety",
  "service",
  "tickets",
  "templates",
  "reports",
  "analytics",
  "automations",
  "csat",
  "audit",
  "studio",
]);
export function ContextGuideLink({
  canPurchase = false,
}: {
  canPurchase?: boolean;
}) {
  const path = usePathname() ?? "";
  const first = path.split("/")[1];
  const id = path.startsWith("/stock/handoffs")
    ? "production-handoff"
    : path.startsWith("/finance/purchases") ||
        (canPurchase && path.startsWith("/finance/suppliers"))
      ? "procurement"
      : guideIds.has(first)
        ? first
        : "getting-started";
  return (
    <Link
      href={path.startsWith("/guides") ? "/guides" : `/guides/${id}`}
      aria-label="Guide for this workspace"
      title="Guide for this workspace"
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
    >
      <BookOpen size={17} />
    </Link>
  );
}
