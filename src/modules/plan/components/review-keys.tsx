"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ReviewKeys({ previous, next }: { previous?: string; next?: string }) {
  const router = useRouter();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (event.key === "ArrowRight" && next) router.push(next);
      if (event.key === "ArrowLeft" && previous) router.push(previous);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, previous, router]);
  return null;
}
