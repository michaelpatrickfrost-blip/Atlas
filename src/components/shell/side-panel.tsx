"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** One native, viewport anchored drawer style for the small workspace utilities. */
export function SidePanel({ open, label, onClose, onAfterClose, children }: {
  open: boolean; label: string; onClose: () => void; onAfterClose?: () => void; children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null), animation = useRef<Animation | null>(null);
  const generation = useRef(0), interruptedTransform = useRef<string | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null), callbacks = useRef({ onClose, onAfterClose });
  useEffect(() => { callbacks.current = { onClose, onAfterClose }; }, [onClose, onAfterClose]);
  useEffect(() => { const timer = setTimeout(() => setMounted(true), 0); return () => clearTimeout(timer); }, []);
  useEffect(() => {
    const node = dialog.current;
    if (!mounted || !node) return;
    const revision = ++generation.current;
    const previousTransform = interruptedTransform.current ?? (node.open ? getComputedStyle(node).transform : "translateX(calc(100% + 24px))");
    interruptedTransform.current = null;
    animation.current?.cancel();
    const duration = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : 240;
    const finishClose = () => {
      if (generation.current !== revision) return;
      node.close(); delete node.dataset.closing;
      if (returnFocus.current?.isConnected) returnFocus.current.focus();
      callbacks.current.onAfterClose?.();
    };
    if (open) {
      if (!node.open) {
        returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        node.showModal();
      }
      delete node.dataset.closing;
      animation.current = node.animate?.([{ transform: previousTransform, opacity: 0.7 }, { transform: "translateX(0)", opacity: 1 }], { duration, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }) ?? null;
    } else if (node.open) {
      node.dataset.closing = "true";
      animation.current = node.animate?.([{ transform: previousTransform, opacity: 1 }, { transform: "translateX(calc(100% + 24px))", opacity: 0.7 }], { duration, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" }) ?? null;
      if (animation.current) animation.current.onfinish = finishClose;
      else finishClose();
    }
    return () => { generation.current = revision + 1; if (node.open) interruptedTransform.current = getComputedStyle(node).transform; animation.current?.cancel(); };
  }, [open, mounted]);
  if (!mounted) return null;
  return createPortal(<dialog ref={dialog} aria-label={label} aria-modal="true" className="atlas-side-panel" onCancel={(event) => { event.preventDefault(); callbacks.current.onClose(); }} onClick={(event) => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) callbacks.current.onClose();
  }}><div className="flex h-full min-h-0 flex-col">{children}</div></dialog>, document.body);
}
