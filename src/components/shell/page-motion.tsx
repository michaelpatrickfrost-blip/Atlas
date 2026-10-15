"use client";

import { ViewTransition, useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/** React coordinates the crossfade with streamed content. Never remount drafts to animate. */
export function PageMotion({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Older browsers retain a lightweight arrival animation. Next's bundled React
    // supplies ViewTransition; standalone React consumers may not support it yet.
    if (typeof ViewTransition !== "undefined" && "startViewTransition" in document) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = content.current?.animate?.(
      [{ opacity: 0.35, translate: "0 5px" }, { opacity: 1, translate: "0 0" }],
      { duration: 240, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
    return () => animation?.cancel();
  }, [pathname]);
  const page = <div ref={content} className="atlas-page-content">{children}</div>;
  return ViewTransition
    ? <ViewTransition name="atlas-workspace" default="none" update="atlas-content" enter="atlas-content" exit="atlas-content" share="atlas-content">{page}</ViewTransition>
    : page;
}
