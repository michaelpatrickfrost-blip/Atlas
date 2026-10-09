"use client";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function WorkspaceBack() {
  const router = useRouter();
  const path = usePathname();
  if (path === "/home") return null;
  return (
    <button type="button" aria-label="Back to previous screen" title="Back" onClick={() => (window.history.length > 1 ? router.back() : router.push("/home"))} className="flex size-9 shrink-0 items-center justify-center rounded-full text-[#6e6e73] hover:bg-black/[0.05] hover:text-[#1d1d1f] focus-visible:outline-2 focus-visible:outline-blue-600 sm:size-11">
      <ArrowLeft size={20} aria-hidden="true" />
    </button>
  );
}
