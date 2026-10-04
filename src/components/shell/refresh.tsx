"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const TYPING = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/** Pull the latest server records into the open page. This is not a window reload. */
export function Refresh({ milliseconds = 8000 }: { milliseconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      const active = document.activeElement;
      if (active instanceof HTMLElement && (TYPING.has(active.tagName) || active.isContentEditable)) return;
      router.refresh();
    };
    const interval = setInterval(tick, milliseconds);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [milliseconds, router]);
  return null;
}
