"use client";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function WorkspaceBack() {
  const router = useRouter();
  const path = usePathname();
  if (path === "/home") return null;
  return (
    <button type="button" aria-label="Back to previous screen" title="Back to previous screen" onClick={() => (window.history.length > 1 ? router.back() : router.push("/home"))} className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700">
      <ArrowLeft size={15} />
      <span className="hidden sm:inline">Back</span>
    </button>
  );
}
