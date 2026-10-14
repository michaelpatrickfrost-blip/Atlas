"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Animate the existing content node, without remounting forms or persistent layouts. */
export function PageMotion({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = content.current?.animate?.(
      [{ opacity: 0.35, translate: "0 5px" }, { opacity: 1, translate: "0 0" }],
      { duration: 240, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
    return () => animation?.cancel();
  }, [pathname]);
  return <div ref={content} className="atlas-page-content">{children}</div>;
}
