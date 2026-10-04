"use client";

import { useEffect, type RefObject } from "react";

/** Close floating panels when the user clicks or taps outside the anchored element. */
export function useOnClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  active: boolean,
  onClose: () => void,
) {
  useEffect(() => {
    if (!active) return;
    function onClick(event: MouseEvent) {
      const node = ref.current;
      if (!node || node.contains(event.target as Node)) return;
      onClose();
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [active, onClose, ref]);
}
